#!/usr/bin/perl
use strict;
use warnings;
use HTML::Template;

use DBI;
require 'dbconfig.pl';
our $dbh;

my $sth;

$sth = $dbh->prepare(
'SELECT DISTINCT clusters.cluster as cluster, starbases.name as planet, sectors.realname as sector
FROM
starbases, tiles 
LEFT JOIN sectors ON sectors.id=tiles.sector_id
LEFT JOIN clusters ON sectors.cluster_id=clusters.id
where clusters.id=sectors.cluster_id and
starbases.sector_id=sectors.id and starbases.sector_id=tiles.sector_id and
starbases.x=tiles.x and starbases.y=tiles.y and
foreground=? order by clusters.cluster,
`starbases`.name'
);

my @classes=qw(m i d g r a);
my %classes;
foreach my $k (@classes) {
    $sth->execute("foregrounds/planet_$k.png");
    while(my $r=$sth->fetchrow_hashref) {
        $r->{'planet'}=~s/\&nbsp;//g;
        push @{$classes{$k}}, $r;
    }
}

my @cl=();
foreach my $k (@classes) {
    push @cl, {class => uc($k), list => $classes{$k}, count => $#{ $classes{$k} }};
}

my $tmpl=HTML::Template->new(
    filename => 'planets.html',
    die_on_bad_params => 0,
);
$tmpl->param(classes => \@cl);
print $tmpl->output;
