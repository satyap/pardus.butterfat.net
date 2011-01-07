
# This script can be used to test and dump the lookup tables in tables.pl

use DBI;
require 'dbconfig.pl';
require 'tables.pl';

use Data::Dumper;
print Dumper(\%universes);
print Dumper(\%runiverses);
