cat data/html_index.txt \
| bin/extract_html_links.py \
| grep -v '^#' \
| >> data/html_links_$(date +"%Y-%m-%d").csv 
