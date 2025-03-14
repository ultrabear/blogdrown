#!/bin/env python3

from asyncio.taskgroups import TaskGroup
import glob
import asyncio
import time
from pathlib import Path

PIPE = asyncio.subprocess.PIPE


async def compress_one_file(program: str, args: list[str], file: Path, ext: str):
    start = time.monotonic_ns()
    task = await asyncio.create_subprocess_exec(
        program, *args, str(file), stdout=PIPE, stderr=PIPE
    )
    await task.communicate()
    end = time.monotonic_ns() - start

    took = f"{end / 1000 / 1000:.1f}ms"

    oldsize = file.stat().st_size / 1024
    newsize = Path(f"{file}.{ext}").stat().st_size / 1024

    stats = f"\x1b[92m{(newsize / oldsize) * 100:.1f}% \x1b[37m({oldsize:.1f}KiB -> {newsize:.1f}KiB) {took}\x1b[0m"

    print(f"\x1b[33m{program}:\x1b[0m {file} {stats}")


compressions: dict[str, tuple[str, list[str]]] = {
    "gz": ("gzip", ["-k"]),
    "br": ("brotli", []),
    "zst": ("zstd", []),
}


async def compress(f: Path, tg: TaskGroup):
    for ext, (program, args) in compressions.items():
        if not Path(f"{f}.{ext}").exists():
            tg.create_task(compress_one_file(program, args, f, ext))


async def main():
    async with asyncio.TaskGroup() as tg:
        for f in map(Path, glob.iglob("dist/**", recursive=True)):
            if f.suffix in {".js", ".css", ".html", ".svg", ".txt"}:
                tg.create_task(compress(f, tg))


if __name__ == "__main__":
    asyncio.run(main())
