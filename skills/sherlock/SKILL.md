# Sherlock — Username OSINT

## Description
Sherlock is a classic username OSINT tool that searches for a given username across 300+ social networks, forums, and platforms. It is the original and most widely-known free username scanner.

**Strengths:** Large site coverage, well-maintained site list, simple output.
**Weaknesses:** Maigret has surpassed it in site count and features; some sites now block Sherlock specifically.

## Entry Point
```
python -m sherlock_project.sherlock <username> [options]
```
Note: Must be run from `tools/sherlock/sherlock_project/` directory context.

## Essential Commands

### Basic scan
```
python -m sherlock_project.sherlock johndoe --print-found
```

### Output to file
```
python -m sherlock_project.sherlock johndoe --print-found -o johndoe_results.txt
```

### CSV output
```
python -m sherlock_project.sherlock johndoe --csv -o johndoe_results.csv
```

### Excel output
```
python -m sherlock_project.sherlock johndoe --xlsx -o johndoe_results.xlsx
```

### Limit to specific site
```
python -m sherlock_project.sherlock johndoe --site twitter --print-found
```

### Use proxy
```
python -m sherlock_project.sherlock johndoe --proxy socks5://127.0.0.1:9050 --print-found
```

### Browse to all found profiles
```
python -m sherlock_project.sherlock johndoe --browse --print-found
```

### Verbose (show all sites checked)
```
python -m sherlock_project.sherlock johndoe --verbose
```

## Integration with osint-toolkit
```
python tools/osint-toolkit.py username <username>
```
Runs Sherlock as part of a multi-tool username sweep.

## Best Practices
1. Run both Maigret AND Sherlock for maximum site coverage
2. Use `--print-found` to suppress negative results
3. Sherlock and Maigret will produce overlapping but non-identical results
4. Try username variants: `johndoe`, `john.doe`, `john_doe`, `johndoe123`, `johndoeuk`
5. `--browse` opens all found profiles in the default browser

## Source
GitHub: github.com/sherlock-project/sherlock
Location: `C:\Users\bryan\.openclaw\workspace\tools\sherlock\`
