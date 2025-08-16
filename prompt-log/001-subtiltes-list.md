You will use "yt-dlp" to download the correct subtitles.
You will create a subtitle abstract service that will use "yt-dlp" and hides this implementation.
This abstraction will first allow to check if "yt-dlp" is available making a call like "yt-dlp --version".
Then will create a function allowing to get the available subtitles by calling "yt-dlp --list-subs {url given as parameter}". If the result contains the text "has no subtitles" display this message. If it contains the text "[info] Available subtitles for" list the available language. For example, answer:
"""
[info] Available subtitles for eKuFqQKYRrA:
Language Name                    Formats
en-US    English (United States) vtt, srt, ttml, srv3, srv2, srv1, json3
"""
The result is "en-US".
Display this into the CLI.

An orchestrator will manage the interaction in this order:
1. Check if "yt-dlp" is available 
2. List available subtitles

The orchestrator must use the abstraction. "Yt-dlp" interaction must be constrained into the service abstraction and should not leak it's related to yt-dlp implementation.