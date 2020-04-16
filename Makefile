PORT ?= 8000

run:
	ruby -run -ehttpd . -p$(PORT)
