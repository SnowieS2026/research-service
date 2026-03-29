# Phone OSINT

## Description
Phone number OSINT identifies the owner, carrier, location, and associated online accounts for a given phone number. Useful for vetting contacts, verifying identities, and identifying unknown callers.

**Note:** UK numbers yield better results with specific UK-focused tools. US numbers have the most data available through free services.

## Free Tools Available

### Spydialer (best free option)
Opens Spydialer.com in browser — free phone lookup that can return:
- Carrier information
- Voicemail status
- Associated names/addresses
- Some owner details

```
python tools/osint-toolkit.py phone <number>
```

### Truecaller
Opens Truecaller web search. Truecaller is the largest phone number database (10B+ numbers), but:
- Free tier is limited
- Requires app for full access
- Most useful for mobile numbers

```
python tools/osint-toolkit.py truecaller <number>
```

### Numverify
Free API-based phone validation and carrier lookup. 100 free lookups/month.

```
python tools/osint-toolkit.py phone <number>
```
(Also opens Numverify)

## OSINT Workflow for a Phone Number

### Step 1: Identify the number
```
python tools/osint-toolkit.py phone <full_number>
```
Use international format: +44 for UK, +1 for US.

### Step 2: Cross-reference with WhatsApp
Search the number in WhatsApp — if linked to a WhatsApp account, the profile photo and status may be visible.

### Step 3: Check for username association
Some services link phone numbers to usernames. Try:
- Telegram: search the number in Telegram
- Signal: search the number in Signal
- WeChat: search the number in WeChat

### Step 4: Search the number online
Use SearxNG:
```
python skills/searxng-research/scripts/search.py "<phone_number>" -n 10
```
Quotes are important — prevents the number being interpreted as multiple search terms.

### Step 5: Reverse image (if associated account found)
If a profile photo is found, run reverse image search to check if it's a stock photo or stolen image.

## Number Format Guide
| Country | Format | Example |
|---------|--------|---------|
| UK | +44 | +44 7911 123456 |
| US | +1 | +1 555 123 4567 |
| Germany | +49 | +49 151 12345678 |
| France | +33 | +33 6 12 34 56 78 |

## Best Practices
1. **UK numbers:** Spydialer and Truecaller work best; UK data is generally more restricted than US
2. **Never do voice calls to numbers you don't trust** — this reveals your number
3. **SMS is traceable** — assume any interaction with a number creates a log
4. **VOIP numbers** (Google Voice, TextNow, etc.) are harder to trace — look for associated emails
5. **Combine with email OSINT** — many services link phone to email, which then links to accounts

## Tools
- Spydialer: spydialer.com (free, no account needed)
- Truecaller: truecaller.com (free tier limited)
- Numverify: numverify.com (100 free/month, API available)
