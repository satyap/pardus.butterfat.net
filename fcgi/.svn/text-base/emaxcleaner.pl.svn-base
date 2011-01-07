#remove emaxes that are surrounded by emaxes or null (nodata, i.e. not in the db) fields
# loop over tiles with emaxes
#   try to find all neighbouring tiles with background!=emax
#   if found, leave alone else add to delete list.
# delete all from the delete list

use strict;
use warnings;

use DBI;
require 'dbconfig.pl';
$|=1;

our $dbh;
my $offset=$ARGV[0] || 0;

#my $sthemax=$dbh->prepare('SELECT * FROM `tiles` WHERE background="emax" ORDER BY `sector_id` LIMIT '. $offset.',10000');
#my $sthemax=$dbh->prepare('SELECT * FROM `tiles` WHERE background="emax" ORDER BY `sector_id` LIMIT 1000');
my $sthemax=$dbh->prepare('SELECT * FROM `tiles` WHERE background="emax" ORDER BY `sector_id`');

my $sthn=$dbh->prepare('SELECT id FROM `tiles` WHERE sector_id=? and x=? and y=? and background!="emax"');
my $sthc=$dbh->prepare('SELECT x,y FROM `tiles` WHERE sector_id=? and background!="emax"');

my %sectorcache;
my $sector_id=-1;
$sthemax->execute;
my @ids;

while(my $e=$sthemax->fetchrow_hashref()) {
    if($sector_id!=$e->{'sector_id'}) {
        $sector_id=$e->{'sector_id'};
        %sectorcache=build_sector_cache($sector_id);
    }
    my $deletable=1; #if a non-emax tile is found, this tile isn't deletable
    foreach my $c ([-1,-1], [-1,0], [-1,1],  [0,-1], [0,1],  [1,-1], [1,0], [1,1]) {
        my $ox=$e->{'x'}+$c->[0];
        my $oy=$e->{'y'}+$c->[1];
        my $key=$ox . '_' . $oy;
        # is there a cached version of a non-emax field?
        unless(exists $sectorcache{$key}) {
            next;
            # never heard of it...
            # assume there isn't one in the database
            $sectorcache{$key}=0;
            $sthn->execute($sector_id, $ox, $oy);
            # let's see if it's in the db
            while(my $r=$sthn->fetchrow_hashref) {
                # there is, and it wasn't cached.
                $sectorcache{$key}=1;
                $deletable=0;
            }
        } elsif($sectorcache{$key}==1) {
            # heard of it, and it's not an emax field
            $deletable=0;
        }
        last if $deletable==0;
    }
    #print "$deletable, $e->{'id'}\n" if $deletable==1;
    push(@ids, $e->{'id'}) if $deletable==1;
    #print "delete: " if $deletable==1;
    print "handling $sector_id, $e->{'id'}\n";
}

my $sth=$dbh->prepare('delete from tiles where id=?');
foreach my $id (@ids) {
    $sth->execute($id);
}


sub build_sector_cache() {
    my $id=shift;
    my %cache;
    $sthc->execute($id);
    while(my $r=$sthc->fetchrow_hashref) {
        my $key= $r->{'x'} . '_' . $r->{'y'};
        $cache{ $key}=1;
    }
    return %cache;
}
