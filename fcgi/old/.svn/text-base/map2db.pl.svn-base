# BSC mapper to TIRO mapper conversion script. run only under strict supervision.
# NOT FOR CRON JOBS, CGI SCRIPTS, ETC!

use strict;
use warnings;
#use FCGI;
use DBI;
use XML::LibXML;
use Data::Dumper;
require 'dbconfig.pl';

local $/;
my $data=<STDIN>;
our $dbh;


my %clusters;
my %sectors;
my $sth=$dbh->prepare('SELECT id,cluster FROM clusters');
$sth->execute;
while(my $r=$sth->fetchrow_hashref) {
    $clusters{$r->{'cluster'}}= $r->{'id'};
}

$sth=$dbh->prepare('select id, name, realname from sectors');
$sth->execute;
while(my $r=$sth->fetchrow_hashref) {
    $sectors{$r->{'realname'}} = $r;
}

my $secs=&XMLin($data, \%sectors);
print Dumper \%clusters;

$sth=$dbh->prepare('INSERT INTO sectors (`name`, realname, x,y,cluster_id) values (?,?,?,?,?)');

foreach (@$secs) {
    print $_->{'cluster'} unless exists $clusters{$_->{'cluster'}};
    unless (exists $sectors{$_->{'name'}}) {
        my $name=$_->{'name'};
        my $realname=$name;
        $name=~s/[^-_0-9A-Za-z]//g;
        $sth->execute($name, $realname, $_->{x}, $_->{y}, $clusters{$_->{'cluster'}});
    }
}


sub XMLin() {
    my $file = shift;
    my $dbsectors=shift;
    my $parser=new XML::LibXML;
    my $doc=$parser->parse_string($file);
    my $elems = $doc->documentElement;
    my @sectors = $elems->findnodes('//PARDUS/MAP/SECTOR');
    my @sec;
    my @wormholes;
    foreach my $sec (@sectors) {
        
        my @s=xml2hash(undef, undef, $sec );
        my $sname=$s[0]->{'name'};
        my $sectorid=$dbsectors->{$sname}->{'id'};
        
        my @tiles=$sec->findnodes('FIELDS');
        my @t;
        foreach my $t (@tiles) {
            my @f=$t->findnodes('F');
            @f=xml2hash(undef,undef,@f);
            push @t,xml2hash('fields',\@f,$t);
        }
        #print Dumper(\@t);
        #inserttiles($sectorid, \@t);
        # my @w = $sec->findnodes('WORMHOLE');
        # foreach my $t (@w) {
        #     my $temp=(xml2hash(undef,undef,$t))[0];
        #     delete $temp->{'tox'};
        #     delete $temp->{'toy'};
        #     $temp->{'sectorid'}=$sectorid;
        #     $temp->{'sectorname'}=$sname;
        #     push @wormholes,$temp;
        # }
        #push(@sec,xml2hash('tiles', \@t, $sec ));
    }
    #print Dumper(\@wormholes);
    #print $#wormholes;
    #insertwhs(\@wormholes);

    #print Dumper(\@sec);
    exit;
    return \@sec;

}


sub inserttiles() {
    my $sectorid=shift;
    my $tiles=shift;
    my $bg={
       Ore => 'ast',
       Energy => 'energy',
       'Hydrogen Fuel' =>'spa',
       'Nebula Gas' =>'neb',
       'Exotic Matter' => 'ematter',
       'Viral Cloud' => 'vir'
    };
    
    $dbh->do('START TRANSACTION');
    my $sth=$dbh->prepare('INSERT INTO tiles (sector_id, x,y,background,ts) VALUES(?,?,?,?,NOW())');
    my $sthexists=$dbh->prepare('SELECT COUNT(*) FROM tiles WHERE sector_id=? and x=? and y=?');
    foreach my $t (@$tiles) {
        my $fields=$t->{'fields'};
        #print Dumper($fields);
        print $bg->{$t->{'type'}};
        foreach my $f (@$fields) {
            $sthexists->execute($sectorid, $f->{x}, $f->{y});
            my $c=$sthexists->fetchrow_arrayref->[0];
            print $c;
            next if $c>0;
            $sth->execute($sectorid, $f->{x}, $f->{y}, $bg->{$t->{'type'}} );
        }
    }
    $dbh->do('commit');
}

sub insertwhs() {
    my $whs=shift;

    $dbh->do('START TRANSACTION');
    my $sthcount=$dbh->prepare('SELECT id FROM tiles WHERE sector_id=? and x=? and y=?');
    my $sthupdate=$dbh->prepare('UPDATE tiles set foreground=?,wormhole=? WHERE id=?');
    my $fg='foregrounds/wormhole.gif';
    
    foreach my $wh (@$whs) {
        $sthcount->execute($wh->{'sectorid'}, $wh->{x}, $wh->{y});
        my $r=$sthcount->fetchrow_hashref;
        if ($r) {
            my $name=$wh->{sector};
            $name=~s/[^-_0-9A-Za-z]//g;
            $sthupdate->execute($fg,$name, $r->{id});
        }
        else {print "$wh->{sectorname} $wh->{x} $wh->{y}\n";}
    }
    $dbh->do('commit');
}


sub xml2hash() {
    my $extraitem=shift;
    my $extrastuff=shift;
    my @nodes=@_;
    my @ret;
    foreach my $field (@nodes) {
        my $fields={};
        foreach my $attr ($field->attributes) {
            $fields->{lc $attr->name}=$attr->value;
        }
        if($extraitem) {
            $fields->{$extraitem}=$extrastuff;
        }
        push(@ret, $fields);
    }
    return @ret;
}
