#!/usr/bin/perl
exit; # one-time script to enable multiverse support
use strict;
use warnings;
use DBI;
require 'dbconfig.pl';
require 'tables.pl';

our $dbh;
our %universes;


# Get all cluster ids in a list
# Also create a hash with universe id as key and list of clusters as value
# Go through the list for each universe id that is not orion, and re-insert the
# same cluster. Get the new id and create a map from orion's cluster to the new
# cluster.
# Get all the sectors for Orion (1) and re-insert them for each cluster on list that is not orion. 

my @clusters;
my %clustermap; # map of which cluster ids in orion correspond to which cluster ids in other uni's

my $sthclusters=$dbh->prepare('SELECT * FROM `clusters` WHERE `universe_id`=?');
$sthclusters->execute($universes{'orion'});

while(my $c = $sthclusters->fetchrow_hashref) {
    print $universes{'orion'};
    push @clusters, $c;
    $clustermap{$c->{'id'}}=[];
}

$sthclusters=$dbh->prepare('INSERT INTO `clusters` (`cluster`,`bgcolor`,`color`,`universe_id`) VALUES (?,?,?,?) ');
foreach my $u (keys %universes) {
    next if $u eq 'orion';
    foreach my $c (@clusters) {
        $sthclusters->execute($c->{'cluster'}, $c->{'bgcolor'}, $c->{'color'}, $universes{$u});
        my $sth = $dbh->prepare('SELECT LAST_INSERT_ID()');
        $sth->execute;
        my $id=$sth->fetchrow_arrayref()->[0];
        push(@{ $clustermap{$c->{'id'} }},  $id);
    }
}

my $sthgetsectors=$dbh->prepare('SELECT * FROM `sectors` WHERE `cluster_id`=?');
my $sthsetsectors=$dbh->prepare('INSERT INTO `sectors` (`name`,`realname`,`ts`,`x`,`y`,`cluster_id`) VALUES(?,?,NOW(),?,?,?)');

foreach my $cluster (keys %clustermap) { # for each cluster in orion
    $sthgetsectors->execute($cluster); # get the sectors
    # for each new cluster corresponding to this cluster, insert the same sectors
    while(my $s = $sthgetsectors->fetchrow_hashref) {
        foreach my $newcluster (@{ $clustermap{$cluster} }) {
            $sthsetsectors->execute($s->{'name'}, $s->{'realname'},$s->{'x'}, $s->{'y'},$newcluster);
        }
    }

}



$dbh->disconnect;

exit;
