# Holehe — Email OSINT

## Description
Holehe checks if an email address exists across 160+ online services. You provide an email, it queries each service's registration/password reset API to determine if an account exists — without sending any emails or notifications.

**Strengths:** No account creation, no notifications sent, fast, accurate for services that leak existence via API response.
**Weaknesses:** Some services block automated queries; results depend on whether the service's API reveals account existence.

## Entry Point
```
python -m holehe <email> [options]
```

## Essential Commands

### Basic scan
```
python -m holehe john.doe@email.com
```

### Check specific sites only
```
python -m holehe john.doe@email.com --sites twitter instagram facebook
```

### Export to CSV
```
python -m holehe john.doe@email.com --csv -o results.csv
```

### JSON output
```
python -m holehe john.doe@email.com --json -o results.json
```

## Two Modes

### Email to account discovery (primary use)
```
python -m holehe <email>
```
Checks 160+ services using the email as the login identifier.

### Username to email discovery (reverse mode)
```
python -m holehe <username>
```
Tries to reverse-engineer email addresses from a username (less reliable).

## Integration with osint-toolkit
```
python tools/osint-toolkit.py email <email_address>
```
Runs Holehe as part of a multi-tool email sweep.

## Best Practices
1. Start with a person's known email — accuracy is highest with real email addresses
2. Combine with Maigret for cross-referencing: Maigret for username, Holehe for email
3. The `--csv` output is useful for piping into other tools or spreadsheets
4. For investigation, cross-reference the email with the person's known aliases and dates

## Source
`pip install holehe` | GitHub: github.com/megadose/holehe
