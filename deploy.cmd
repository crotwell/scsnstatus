#!/bin/bash

ember build --environment=production && scp -r dist/* scsn@eeyore.seis.sc.edu:/data/scsn/www/scsnstatus/.

