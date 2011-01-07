#copies a given sector id to a given sector id. does not overwrite existing tiles in target sector

use strict;
use warnings;

use DBI;
require 'dbconfig.pl';
$|=1;

our $dbh;

my $s1_id=$ARGV[0] || die "sector ids required";
my $s2_id=$ARGV[1] || die "sector ids required";

my $sths=$dbh->prepare("SELECT * FROM `tiles` WHERE sector_id=?");

my %sector2;
my @newtiles=();

$sths->execute($s2_id);
while(my $r=$sths->fetchrow_hashref) {
    my $key=$r->{'x'} . '_' . $r->{'y'};
    $sector2{$key}=$r;
}

$sths->execute($s1_id);
while(my $r=$sths->fetchrow_hashref) {
    my $key=$r->{'x'} . '_' . $r->{'y'};
    unless (exists $sector2{$key}) {
        delete $r->{'id'};
        $r->{'foreground'}='' unless $r->{'foreground'}=~/wormhole.gif/;
        $r->{'sector_id'}=$s2_id;
        push @newtiles, $r;
    }
}

exit if $#newtiles<0;
print $#newtiles+1, " to insert\n";

my $sql="INSERT INTO `tiles` (";
my @keys;
my @params;
foreach my $key (keys %{ $newtiles[0] }) {
    push @keys, $key;
    push @params, '?';
}
$sql.=join(',', @keys) . ') VALUES (' . join(',',@params) . ')';
my $sthi=$dbh->prepare($sql);
$dbh->do('START TRANSACTION');
foreach my $tile (@newtiles) {
    my @values;
    foreach my $k (@keys) {
        push @values, $tile->{$k};
    }
    print $sthi->execute(@values);
}
print $dbh->do('COMMIT');
print "done\n";
