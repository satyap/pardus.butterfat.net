# removes duplicate tiles, so that (sector_id, x,y) is unique
use strict;
use warnings;

use DBI;
require 'dbconfig.pl';
$|=1;

our $dbh;

our $sth=$dbh->prepare('SELECT * FROM `tiles`  WHERE sector_id=? ORDER BY sector_id,ts,id');
$sth->execute($ARGV[0]);

my %tilecache=();
my $sector_id=-1;
my @deletes;

while(my $r=$sth->fetchrow_hashref) {
    my $key=$r->{'x'} . '_' . $r->{'y'} . '_' . $r->{'sector_id'};
    if($sector_id!=$r->{'sector_id'}) {
        delte(@deletes);
        $sector_id=$r->{'sector_id'};
        %tilecache=();
        @deletes=();
    }
    if(exists $tilecache{$key}) {
        push @deletes, $r->{'id'};
    }
    $tilecache{$key}=1;
}
        delte(@deletes);

sub delte() {
    my @deletes=@_;
    my $sth=$dbh->prepare("DELETE FROM tiles WHERE id=?");
    print join(",",@deletes) . "\n";
    foreach my $d (@deletes) {
        $sth->execute($d);
    }
}
