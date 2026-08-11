import urllib.request
try:
    url = "http://www.atdcresoc.co.in/assets/receipt/index.php"
    print("Fetching", url)
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read()
        print("Success, length:", len(html))
        with open("receipt_search.html", "wb") as f:
            f.write(html)
except Exception as e:
    print("Error:", e)
