# PowerShell cannot run `New-NetFirewallRule` without elevation.
# Work around by using the built‑in Windows firewall command line
# that does not require admin rights when you explicitly request
# it via `runas` or by editing the firewall profile.

# The simplest fix is to add an inbound rule with `netsh advfirewall`
# which can be executed from the normal user context.

# Example (append to the script if you really need the rule):
#   netsh advfirewall firewall add rule name="OpenClaw Control UI" dir=in action=allow protocol=TCP localport=18789
# If you want the script to do it automatically, prepend `runas` with an
# admin account that you trust, e.g.:
#   runas /user:Administrator "netsh advfirewall firewall add rule name=""OpenClaw Control UI"" dir=in action=allow protocol=TCP localport=18789"
#
# NOTE: This script intentionally avoids invoking `runas` by default to
# keep the automation non‑privileged. Adjust the script to your security
# posture before enabling the actual command.

echo ""
echo "🛠️  Installing Go-based tools..."

go_install "assetfinder"      "github.com/tomnomnom/assetfinder@latest"
go_install "waybackurls"      "github.com/tomnomnom/waybackurls@latest"
go_install "httprobe"         "github.com/tomnomnom/httprobe@latest"
go_install "unfurl"           "github.com/tomnomnom/unfurl@latest"
go_install "kxss"             "github.com/tomnomnom/hacks/kxss@latest"
go_install "fff"              "github.com/tomnomnom/fff@latest"

go_install "httpx"           "github.com/projectdiscovery/httpx@latest"
go_install "nuclei"          "github.com/projectdiscovery/nuclei/v3/...@latest"
go_install "naabu"           "github.com/projectdiscovery/naabu/v2/...@latest"
go_install "katana"          "github.com/projectdiscovery/katana@latest"
go_install "shuffledns"      "github.com/projectdiscovery/shuffledns/...@latest"
go_install "alterx"          "github.com/projectdiscovery/alterx@latest"
go_install "dnsx"            "github.com/projectdiscovery/dnsx/...@latest"
go_install "mapcidr"         "github.com/projectdiscovery/mapcidr/...@latest"
go_install "asnmap"          "github.com/projectdiscovery/asnmap@latest"

go_install "ffuf"             "github.com/ffuf/ffuf@latest"
go_install "goffer"          "github.com/ctrldevelop/goffer@latest"

go_install "amass"           "github.com/owasp-amass/amass/v3/...@latest"
go_install "findomain"       "github.com/findomain/findomain@latest"

go_install "dalfox"          "github.com/hahwul/dalfox/v2@latest"
go_install "hakrawler"       "github.com/hakluke/hakrawler@latest"
go_install "gospider"        "github.com/jaeles-project/gospider@latest"

go_install "subfinder"        "github.com/projectdiscovery/subfinder@latest"
go_install "passive-subfinder" "github.com/princechaddha/passive-subfinder@latest"

echo ""
echo "🛠️  Installing Python-based tools..."

pip_install "sqlmap"
pip_install "dalfox" 2>/dev/null || true  # may already be go
pip_install "dirsearch"
pip_install "xsstrike"
pip_install "commix"
pip_install "wpscan" 2>/dev/null || true
pip_install "ssrfmap"
pip_install "sublist3r"
pip_install "wfuzz"
pip_install "nikto"
pip_install "trufflehog"

echo ""
echo "🛠️  Installing Ruby-based tools..."
gem install whatweb 2>/dev/null || true
gem install wpscan 2>/dev/null || true

echo ""
echo "📥 Cloning wordlists & resources..."

# SecLists
if [ ! -d "../SecLists" ]; then
  git clone --depth 1 https://github.com/danielmiessler/SecLists.git ../SecLists
  echo "  ↳ SecLists cloned"
else
  echo "  ↳ SecLists already exists, skipping"
fi

# PayloadsAllTheThings
if [ ! -d "../PayloadsAllTheThings" ]; then
  git clone --depth 1 https://github.com/swisskyrepo/PayloadsAllTheThings.git ../PayloadsAllTheThings
  echo "  ↳ PayloadsAllTheThings cloned"
else
  echo "  ↳ PayloadsAllTheThings already exists, skipping"
fi

# Oneforall (advanced subdomain enum)
if [ ! -d "../OneForAll" ]; then
  git clone --depth 1 https://github.com/shmilylty/OneForAll.git ../OneForAll
  echo "  ↳ OneForAll cloned"
else
  echo "  ↳ OneForAll already exists, skipping"
fi

echo ""
echo "🔄 Updating nuclei templates..."
nuclei -update-templates 2>/dev/null || echo "  ⚠️ nuclei-templates update skipped"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add targets to scope"
echo "  2. Run: ./scripts/recon-all.sh target.com"
echo "  3. Review results and follow up manually"
echo ""
echo "⚠️  Always stay within program scope and rules!"
