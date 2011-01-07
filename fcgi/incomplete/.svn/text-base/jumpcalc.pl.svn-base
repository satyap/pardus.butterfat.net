#!/usr/bin/perl
use strict;
use warnings;

use CGI;
use DBI;
require 'dbconfig.pl';

our $dbh;

my $sth=$dbh->prepare('SELECT * FROM `sectors` ORDER BY `name`');
$sth->execute;
my @sectors;

while(my $r = $sth->fetchrow_hashref) {
    push @sectors,$r; 
}

print<<HTML;
Content-type: text/html

<html><head><title>Route calculator</title></head><body>

<h1>Pardus inter-sector route calculator</h1>
<form method="post" action="jumpcalc.pl">
<label for="start">Start:
<select name="start" id="start">
HTML

foreach my $s (@sectors) {
    print '<option value="' . $s->{'id'} . '">' . $s->{'realname'} . '</option>';
}

print<<HTML;
</select>
<label for="startx">X:</label>
<input type="text" name="startx" id="startx" />
<label for="starty">Y:</label>
<input type="text" name="starty" id="starty" />
<br/>

<label for="end">End:
<select name="end" id="end">
HTML

foreach my $s (@sectors) {
    print '<option value="' . $s->{'id'} . '">' . $s->{'realname'} . '</option>';
}


print<<HTML;
</select>
<label for="startx">X:</label>
<input type="text" name="startx" id="startx" />
<label for="starty">Y:</label>
<input type="text" name="starty" id="starty" />
<br/>
<label for="drivespeed">Drive type:</label>
<select id="drivespeed" name="drivespeed">
<option value="1">Nuclear</option>
<option value="2">Fusion</option>
<option value="2">Enh. Fusion</option>
<option value="3">Ion</option>
<option value="4">Anti-matter</option>
<option value="4">Enh. Anti-matter</option>
<option value="5">Hyper</option>
<option value="6">Interphased</option>
<option value="6">Enh. Interphased</option>
</select>

<br/>
<label for="whcost">Wormhole jump cost:</label>
<input type="text" name="whcost" id="whcost" value="10" />

<ul>
<li><label for="avoidpc">
<input type="checkbox" name="avoidpc" id="avoidpc" value="1" />Avoid Pardus core cluster
</label>
</li>
<li><label for="avoidpec">
<input type="checkbox" name="avoidpec" id="avoidpec" value="1" />Avoid Pardus Empire Contingent
</label>
</li>
<li><label for="avoidpuc">
<input type="checkbox" name="avoidpuc" id="avoidpuc" value="1" />Avoid Pardus Union Contingent
</label>
</li>
<li><label for="avoidpfc">
<input type="checkbox" name="avoidpfc" id="avoidpfc" value="1" />Avoid Pardus Federation Contingent
</label>
</li>
</ul>

<input type="submit" value="Calculate" />

</form>
HTML

my $q=new CGI;

my $start=$q->param('start');
if($start) {
    &calculateroute($q);
}

END {
    print "</body></html>";
    $dbh->disconnect if $dbh;
}

sub calculateroute() {
    my $q=shift;
    my $start=$q->param('start') || '';
    my $startx=$q->param('startx') || return;
    my $starty=$q->param('starty') || return;
    my $end=$q->param('end') || return;
    my $endx=$q->param('endx') || return;
    my $endy=$q->param('endy') || return;
    my $ds = $q->param('drivespeed') || 1;
    my $wh = $q->param('whcost') || 10;

    # calculate the start sector's costs to adjoining sectors based on startx and starty
    # do same for end sector.
    # get all the inter-sector jumps, exclude avoidance clusters. add $wh to each jump's cost
    # replace the start and end sector's links with links based on costs calculated in the first step
    # run dijkstra's algorithm on the sector graph
    
} # calculateroute
