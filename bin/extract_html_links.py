#!/usr/bin/env python
import requests
from bs4 import BeautifulSoup
import fileinput
import datetime
import sys
import csv
import calendar,time


headers=['time','link','link_text']
today=datetime.datetime.today().strftime('%Y-%m-%d %H-%m')
for line in sys.stdin:
  if line == 'EOF':
    break
  url = line.strip()
  if len(url)<5:
    continue
  sys.stdout.write("\n#url: "+url)
  sys.stdout.write("\n#start_request:"+today)
  try:
    resp = requests.get(url)
    soup=BeautifulSoup(resp.text, 'lxml')
    title = soup.find('title')
    now=datetime.datetime.today().strftime('%Y-%m-%d %H-%m')
    sys.stdout.write("\n#finish_request: "+now)
    sys.stdout.write("\n#header_title: "+title.text)
    sys.stdout.write("\n#headers: time,link,link_text")
  except:
    sys.stderr.write("\nfailed: "+url)
  
  for a in soup.find_all('a',href=True, text=True):
    if not a:
       continue
    line = ("\n{},{},{}").format(now, a.get("href"), a.text)
    sys.stdout.write(line)


