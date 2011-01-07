#!/usr/bin/perl
use strict;
use warnings;

use HTML::Template;
use DBI;
use CGI;
require 'dbconfig.pl';
require 'tables.pl';

our %monsters;
our %monsters_by_id;
our %tile2name;
our $dbh;
our %runiverses;

print "Content-type: text/html\n\n";

my $tmpl = HTML::Template->new(
    filename => 'spawns.html',
);

my $q=CGI->new;
my $cluster_id=$q->param('cluster') || '';
my $monster_id=$q->param('monster') || '';

my @monsters;
foreach my $k (sort keys %monsters) {
    push @monsters, {id=>$monsters{$k}, name => $tile2name{$k},
        selected => $monster_id eq $monsters{$k}?'selected="1"':'',
    };
}

my @clusters;
my $sth=$dbh->prepare('SELECT * FROM `clusters` WHERE `cluster`<>"Starbase" ORDER BY `cluster`,`universe_id`');
$sth->execute;
while(my $r=$sth->fetchrow_hashref) {
    push @clusters, {id => $r->{'id'}, name => $r->{'cluster'} . '-' . $runiverses{$r->{'universe_id'}},
        selected => $cluster_id eq $r->{'id'} ?'selected="1"':'',
    };
}

my @monsterlist=();

if($cluster_id && $monster_id) {
    $sth=$dbh->prepare('SELECT * FROM `sectors` WHERE cluster_id=? ORDER BY `realname`');
    my $msth=$dbh->prepare('SELECT * FROM `spawns` WHERE `monster_id`=? AND `sector_id`=? ORDER BY `lastseen`,`x`,`y`');
    $sth->execute($cluster_id);
    while(my $s=$sth->fetchrow_hashref) {
        $msth->execute($monster_id, $s->{'id'});
        my @list=();
        while(my $r=$msth->fetchrow_hashref) {
            delete $r->{'id'};
            delete $r->{'monster_id'};
            delete $r->{'sector_id'};
            push @list, $r;
        }
        push @monsterlist, {name => $monsters_by_id{$monster_id}, sector => $s->{'realname'}, list => \@list};
    }

}

$tmpl->param(
    'monsters' => \@monsters,
    'clusters' => \@clusters,
    'monsterlist' => \@monsterlist,
);

print $tmpl->output;


