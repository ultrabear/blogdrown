# A real reason
Rust was built out of necessity. The problem? C/++ were the only languages you could use if you were serious about performance and hiring anyone. Full stop, nothing else matched them.

Engineers at Mozilla had a problem; they need performance for their toy project (you may have heard of it, something called, **Firefox**?), but C/++ introduce an incredible amount of CVE's per update, being **memory unsafe languages**.

Rust was developed as a pet project at Mozilla, and then publicly, as an answer to C/++ being the only high performance oriented languages in the wild, a stable 1.0 release was finalized in 2015, and since then, the floodgates opened.

A major concept used in rust is coined "zero cost abstractions", this is a misnomer, the more proper term is "zero runtime cost abstractions", most people just say the former and mean the latter, its fine. But lets define this term; Rust offloads things like methods, traits, functions, data encapsulation (structs/enums) to be fully resolved at compile time, leading to noise free runtime performance, there is no "method resolution order", or "subclass checking", these things are statically asserted in the majority of rust code.

\[Continued in next issue\]
