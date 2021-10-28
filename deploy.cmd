#!/bin/bash

# this causes script to exit if any subcommand returns non-zero error code
set -e

ember build --environment=production
scp -r dist scsn@eeyore.seis.sc.edu:/data/scsn/www/scsnstatus.new
scp -r dist scsn@thecloud.seis.sc.edu:/data/scsn/www/scsnstatus.new
