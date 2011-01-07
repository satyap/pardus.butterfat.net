use strict;
use warnings;
use DBI;
require 'dbconfig.pl';
our $dbh;


my $sthcluster = $dbh->prepare('SELECT * FROM clusters');
my $sth = $dbh->prepare('SELECT COUNT(*) FROM sectors WHERE cluster_id=? AND x IS NOT NULL and x>0');

my $nclusters=0;
my $nsectors=0;
my $maxsectors=[0,''];
my $clusters={};

$sthcluster->execute;

while(my $cluster = $sthcluster->fetchrow_hashref) {
    next if $cluster->{'cluster'} eq 'Starbase';
    $sth->execute($cluster->{'id'});
    my $c=$sth->fetchrow_arrayref;
    $c=$c->[0] if $c;
    $c=0 unless $c;
    $nsectors+=$c;
    $nclusters++;
    if ($c>$maxsectors->[0]) {
        $maxsectors=[$c, $cluster->{'cluster'}];
    }
    $clusters->{$cluster->{'cluster'}}=$c;
}

foreach my $k (sort {$clusters->{$a} <=> $clusters->{$b}} keys %$clusters) {
    print "$k: $clusters->{$k} sectors\n";
}

print "$nclusters clusters, $nsectors sectors total\n";
print "Maximum sectors ($maxsectors->[0]) in $maxsectors->[1]\n";
