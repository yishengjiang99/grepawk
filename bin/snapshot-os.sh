 ps aux | \
awk -v today="${date}" -v OFS=',' -v date="$(date +"%Y-%m-%d %R %z")" \
'BEGIN  \
{print "#COL_TIME",date, today;  \
 print "#date,stat,value,user,proc"} \
{print date, "ps_cpu",$3, $1,$11; \
 print date, "ps_mem",$4,$1,$11}' >> ../timeseries/ps_stat_$(date +"%Y-%m-%d").txt

