#!/usr/bin/perl
use strict;
use warnings;
use DBI;
use CGI;
use Data::Dumper;
use lib '../fcgi/';
require 'dbconfig.pl';
require 'tables.pl';

our $dbh;
our %universes;

local $/;
my $q=new CGI;

print "Content-type: text/plain\n\n";



