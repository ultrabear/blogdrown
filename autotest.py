#!/bin/env python

import threading
import sys
import subprocess
import time
from queue import Queue

from dataclasses import dataclass

from typing import Dict, List, Iterator


# Represents a ascii escaped color string
class Color:
    __slots__ = ()
    red = "\033[91m"
    blue = "\033[94m"
    reset = "\033[0m"
    green = "\033[92m"
    yellow = "\033[93m"


@dataclass
class RunningProc:
    args: str
    stdout: bytes
    stderr: bytes
    duration_ns: int
    returncode: int


def into_str(args: List[str], subdir: str) -> str:
    return f"{subdir}: {' '.join(args)}"


def run(args: List[str], cwd: str, q: "Queue[RunningProc]") -> None:
    start = time.monotonic_ns()
    ret = subprocess.run(args, capture_output=True, cwd=cwd)

    q.put(
        RunningProc(
            into_str(args, cwd),
            ret.stdout,
            ret.stderr,
            time.monotonic_ns() - start,
            ret.returncode,
        )
    )


def initjobs(tests: Dict[str, List[str]]) -> "Queue[RunningProc]":
    testout: "Queue[RunningProc]" = Queue(maxsize=len(tests))

    for subdir, commands in tests.items():
        for cmd in commands:
            t = threading.Thread(target=run, args=(cmd.split(" "), subdir, testout))
            t.start()

    return testout


def lim_yield(q: "Queue[RunningProc]", lim: int) -> Iterator[RunningProc]:
    for _ in range(lim):
        yield q.get()


def finishjobs(testout: "Queue[RunningProc]", tests_c: int) -> int:
    errno = 0

    for v in lim_yield(testout, tests_c):
        err = v.stdout.decode("utf8") + v.stderr.decode("utf8")

        duration_raw = v.duration_ns // 1000 // 1000
        duration = (
            f"{Color.yellow}{duration_raw/1000}sec"
            if duration_raw > 1000.0
            else f"{Color.green}{duration_raw}ms"
        )

        cmdfmt = f"{Color.blue}{v.args} {duration}{Color.reset}"

        print(cmdfmt)
        if err:
            if v.returncode != 0:
                err = f"{Color.red}{err}{Color.reset}"
            print(err, end="")

        if v.returncode != 0:
            errno = 1

    return errno


def main() -> int:
    tests: Dict[str, List[str]] = {
        "frontend": ["pnpm biome check", "pnpm lint", "pnpm tsc -b"],
        "backend": [
            "cargo fmt --check",
            "cargo check",
        ],
    }

    return finishjobs(initjobs(tests), sum(len(v) for v in tests.values()))


if __name__ == "__main__":
    sys.exit(main())
