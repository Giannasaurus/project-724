# !bin/bash

dotnet run \
| grep 'error' \
| grep -Eo '/[^\/]*/[^\/]*.[a-zA-Z]*\([0-9]+, *[0-9]+\).*' \
| grep --color=always -E '\([0-9]+, *[0-9]+\)' \
| grep --color=always -E "'[^']*'" \
| sort
