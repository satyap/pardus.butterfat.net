use strict;
use warnings;
use DBI;
use HTML::Template;
require 'dbconfig.pl';
require 'tables.pl';

our $dbh;
my $out='/home/satyap/web/pardusmapper/maps/';
our %universes;
my $uni=$ARGV[0] || die "Want one of " . join(' ',keys(%universes));
die "One of " . join(' ',keys(%universes)) unless exists($universes{$uni}) ;
$out .= $uni .'/';


my $sql = 'SELECT 
clusters.cluster,
clusters.color,
clusters.bgcolor,
sectors.name as sname,
sectors.realname as srname,
starbases.* 
FROM starbases 
LEFT JOIN sectors ON starbases.sector_id = sectors.id
LEFT JOIN clusters ON sectors.cluster_id = clusters.id
WHERE `clusters`.`universe_id`=?
ORDER BY clusters.cluster, starbases.name,sectors.name,x,y
';
my $sth = $dbh->prepare($sql);
$sth->execute($universes{$uni});

my @sbs;
my $oldcluster='';
my $oldsector='';
my $newcluster=0;
my $newsector=0;

while(my $r=$sth->fetchrow_hashref) {
    my $cluster=$r->{'cluster'} || '?';
    my $sector=$r->{'sname'} || '?';
    my $sectorname=$r->{'srname'} || '?';
    if($oldcluster ne $cluster) {
        $newcluster=1;
        $oldcluster=$cluster;
    }
    if($oldsector ne $sector) {
        $newsector=1;
        $oldsector=$sector;
    }
    push(@sbs, {
            name => $r->{'name'},
            cluster => $cluster,
            sector => $sector,
            sectorname => $sectorname,
            newcluster => $newcluster,
            newsector => $newsector,
            color => $r->{'color'},
            bgcolor => $r->{'bgcolor'},
            ts => $r->{'ts'},
            x => $r->{x},
            y => $r->{y},
        });
    print $r->{'name'};
    $newcluster=0;
    $newsector=0;
}

my $tmpl = HTML::Template->new(filename => 'locations.tmpl');
$tmpl->param(sbs => \@sbs);
open(O, ">${out}locations.html") || die $!;
print O $tmpl->output;
close(O);
#use Data::Dumper;
#print Dumper \@sbs;
