#!/usr/bin/perl
use strict;
use warnings;
#use FCGI;
use DBI;
use XML::LibXML;
use Data::Dumper;
require 'dbconfig.pl';
require 'tables.pl';

sub XMLin($);

our $dbh;
our %monsters;
our %universes;
our %uni_ids;

my $sth;
$sth->{'setsector'} = $dbh->prepare('INSERT INTO `sectors` (`name`,`ts`,`realname`,`cluster_id`) VALUES (?,NOW(),?,?)');
$sth->{'getsector'} = $dbh->prepare('SELECT `sectors`.`id` FROM `sectors`,`clusters` WHERE `sectors`.`name`=? AND `clusters`.`universe_id`=? AND `sectors`.`cluster_id`=`clusters`.`id`');

$sth->{'getoldtile'} = $dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=? AND `x`=? AND `y`=?');
#$sth->{'getrecenttile'} = $dbh->prepare('SELECT COUNT(*) FROM `tiles` WHERE `sector_id`=? AND `x`=? AND `y`=? AND ts>DATE_SUB(NOW(), INTERVAL 1 HOUR)');
$sth->{'getwormhole'} = $dbh->prepare('SELECT COUNT(*) FROM `tiles` WHERE `sector_id`=? AND `x`=? AND `y`=? AND wormhole<>""');

$sth->{'updatetile'} = $dbh->prepare('UPDATE `tiles` SET `foreground`=?, `background`=?,`wormhole`=?, `ts`=NOW() WHERE `id`=?');

$sth->{'inserttile'} = $dbh->prepare('INSERT INTO `tiles` (
    `sector_id`,  `x`,`y`, `foreground`,`background`, `wormhole`,    `ts`) VALUES(
    ?,              ?,  ?,            ?,           ?,          ?,  NOW() )'
);
$sth->{'insertspawn'} = $dbh->prepare('INSERT INTO `spawns` (`monster_id`,`sector_id`,`x`,`y`,`lastseen`) VALUES(?,?,?,?,NOW())');
$sth->{'getoldsb'} = $dbh->prepare('SELECT id FROM `starbases` WHERE sector_id=? and x=? and y=?');
$sth->{'updatesb'} = $dbh->prepare('UPDATE `starbases` SET `name`=? WHERE id=?');
$sth->{'insertsb'} = $dbh->prepare('INSERT INTO `starbases` (`name`,`sector_id`,x,y) VALUES (?,?,?,?)');

          
#$sth->{'getid'} = $dbh->prepare('SELECT LAST_INSERT_ID()');

#while (FCGI::accept >= 0) {

$dbh->do('DELETE FROM `spawns` WHERE DATE_ADD(`lastseen`,INTERVAL 300 DAY)<NOW()');
print "Content-type: text/plain\n\n";
local $/;
my $data=<STDIN>;
if( length($data) > 0 ) {
    #warn $data;
    my $sectors=XMLin($data);
    #warn Dumper($sectors);
    foreach my $uni (keys %$sectors) { 
        #warn $data if $uni eq 'pegasus';
        #warn Dumper($sectors) if $uni eq 'pegasus';
        foreach my $sec (keys %{ $sectors->{$uni} } ) {
            if(! &insertdb($sth, $sectors->{$uni}->{$sec}, $sec, $uni)) {
                warn "Trying $sec again";
                &insertdb($sth, $sectors->{$uni}->{$sec}, $sec, $uni);
            }
            #warn "Inserted $sec in universe $uni";
        }
    }
}

foreach (keys %$sth) {
    $sth->{$_}->finish;
}

$dbh->disconnect;

exit;
########################

sub insertdb() {
    my $sth=shift;
    my $sector=shift;
    my $name=shift;
    my $uni=shift;
    my $realname=$name;
    $name=~s/[^-_0-9A-Za-z]//g;
    $dbh->do("LOCK TABLES `sectors` WRITE, `tiles` WRITE, `starbases` WRITE,`spawns` WRITE,`clusters` WRITE");

    my $sectorid;
    return unless exists $universes{$uni};

    $sth->{'getsector'}->execute($name, $universes{$uni});
    while(my $r = $sth->{'getsector'}->fetchrow_hashref) {
        $sectorid=$r->{'id'};
    }
    
    unless($sectorid) {
        warn "$name does not exist in universe $uni";
        $sth->{'setsector'}->execute($name, $realname, $uni_ids{$uni}) || die $DBI::errstr;
        warn "insert into sector, cluster_id=$uni_ids{$uni} (uni=$uni)";
        my $sthid=$dbh->prepare('SELECT LAST_INSERT_ID()');
        $sthid->execute();
        while(my $r = $sthid->fetchrow_arrayref) {
            $sectorid=$r->[0];
        }
        $sthid->finish();
    }

    unless($sectorid) {
        $dbh->do("UNLOCK TABLES");
        warn "couldn't find $name";
        return 0;
    }
    
    foreach my $tile (@{ $sector->{'tiles'} }) {
        $tile->{'background'}=$tile->{'bg'} if exists $tile->{'bg'};
        $tile->{'foreground'}=$tile->{'fg'} if exists $tile->{'fg'};
        $tile->{'wormhole'}=$tile->{'wh'} if exists $tile->{'wh'};
        next if $tile->{'background'}=~/nodata/;
        $tile->{'wormhole'}=~s/[^-_0-9A-Za-z]//g;
        $tile->{'foregound'}='' unless $tile->{'foreground'};
        $tile->{'wormhole'}='' unless $tile->{'wormhole'};
        if($tile->{'foreground'}=~/ships\//) {
            warn "ship, right ahead!";
            $tile->{'foregound'}='';
        }
        else {
            $tile->{'foreground'}=~s/[^-_0-9A-Za-z\/\.]//g;
        }
        
        $tile->{'background'}=~s/[^-_0-9A-Za-z\/\.]//g;
        $tile->{'background'}=~s/.*energymax.*/emax/g;
        $tile->{'background'}=~s/.*energy.*/energy/g;
        $tile->{'background'}=~s/.*nebula.*/neb/g;
        $tile->{'background'}=~s/.*asteroids.*/ast/g;
        $tile->{'background'}=~s/.*space.*/spa/g;
        $tile->{'background'}=~s/.*exotic.*/ematter/g;
        $tile->{'background'}=~s/.*viral.*/vir/g;
        my @tiledata=($sectorid, $tile->{'x'}, $tile->{'y'} );
        if($tile->{'foreground'} =~ /wormhole.gif/ && $tile->{'wormhole'} eq '') {
            # if a wormhole, but no jump data, check if we have historical jump data.
            # if we've seen the jump data in the past, don't bother updating.
            # ==> it's a known wormhole
            # otherwise, treat as normal tile
            $sth->{'getwormhole'}->execute(@tiledata);
            if($sth->{'getwormhole'}->fetchrow_arrayref()->[0] > 0) {
                next;
            }
        }
        # insert NPC data if any
        if($tile->{'foreground'}=~/^opponents/ && exists($monsters{$tile->{'foreground'}})) {
            $sth->{'insertspawn'}->execute($monsters{$tile->{'foreground'}} , @tiledata);
        }

        $sth->{'getoldtile'}->execute(@tiledata);
        # now see if we already have this identical tile
        my $found=0;
        my $match=0;
        while(my $r=$sth->{'getoldtile'}->fetchrow_hashref) {
            $r->{'foreground'}='' unless defined $r->{'foreground'};
            $r->{'background'}='' unless defined $r->{'background'};
            $r->{'wormhole'}='' unless defined $r->{'wormhole'};
            # even if it's an identical tile, we want to update the timestamp.
            #if(
            #    $r->{'foreground'} eq $tile->{'foreground'} && 
            #    $r->{'background'} eq $tile->{'background'} &&
            #    $r->{'wormhole'} eq $tile->{'wormhole'}
            #) { $match=1 }
            $found=$r->{'id'};
        }
        #next if $match==1; # identical tile exists, don't bother inserting/updating
        my @tileimages=($tile->{'foreground'}, $tile->{'background'}, $tile->{'wormhole'});
        if($found==0) { # a new tile!
            $sth->{'inserttile'}->execute(@tiledata,@tileimages);
        } elsif($tile->{'squad'} ne '1') {
            # a known tile with different data! and not by a squad, which
            # cannot see npcs.  we want to ignore updates by squads because
            # they would clobber existing npcs from the map.
            $sth->{'updatetile'}->execute(@tileimages,$found) ;
        }
    }

    foreach my $sb (@{ $sector->{'sb'} }) {
        my $sbname=$sb->{'sector'};
        $sbname=~s/\&nbsp;//g;
        $sbname=~s/^\s+//g;
        $sbname=~s/\s+$//g;
        #warn "$realname, $sbname";
        next unless $realname eq $sbname;
        $sth->{'getoldsb'}->execute($sectorid, $sb->{'x'}, $sb->{'y'});
        my $found=-1;
        while(my $r=$sth->{'getoldsb'}->fetchrow_hashref) {
            $found=$r->{'id'};
        }
        if($found>=0) {
            $sth->{'updatesb'}->execute($sb->{'name'}, $found);
        }
        else {
            $sth->{'insertsb'}->execute($sb->{'name'}, $sectorid, $sb->{'x'}, $sb->{'y'});
        }
    }
    
    $dbh->do("UNLOCK TABLES");
    return 1;

} # insertdb

sub XMLin($) {
    my $file = shift;
    my $parser=new XML::LibXML;
    my $doc=$parser->parse_string($file);
    my $seen={};

    my $elems = $doc->documentElement;

    my @snapshots = $elems->findnodes('//pardusmap/snap');
    my $sectors;
    foreach my $snap (@snapshots) {
        my $name='';
        my $squad='r';
        my $uni;
        foreach($snap->attributes) {
            $uni=$_->value if $_->name eq 'uni';
            $name=$_->value if $_->name eq 'sector';
            $squad=$_->value if $_->name eq 'squad';
        }
        next unless $uni;
        my @squares=sq2hash($seen, $name, $squad, $snap->getChildrenByTagName('sq'));
        push(@{ $sectors->{$uni}->{$name}->{'tiles'} }, @squares);
        my @sb=sb2hash($uni, $sectors, $elems->findnodes('sb'));
        #print $#squares+1 . " squares\n";
    }
    return $sectors;

} # XMLin

sub sb2hash() {
    my $uni=shift;
    my $sectors=shift;
    my @nodes=@_;
    my @ret=();
    foreach my $field (@nodes) {
        my $fields={};
        foreach my $attr ($field->attributes) {
            $fields->{$attr->name}=$attr->value;
        }
        next unless $fields->{'uni'};
        my $name=$fields->{'sector'};
        push(@{ $sectors->{$uni}->{$name}->{'sb'} }, $fields) if exists($sectors->{$uni}->{$name});
    }
} # sb2hash

sub sq2hash() {
    my $seen=shift;
    my $name=shift;
    my $squad=shift;
    my @nodes=@_;
    my @ret;
    foreach my $field (@nodes) {
        my $fields={};
        foreach my $attr ($field->attributes) {
            $fields->{$attr->name}=$attr->value;
        }
        my $key=$name.$field->getAttribute('x') .'_'. $field->getAttribute('y');
        next if (exists $seen->{$key} && exists $fields->{'wormhole'} && $fields->{'wormhole'} eq ''); #wormholes are exempt from repitition checks
        $fields->{'squad'}=$squad;
#        warn "squad: " . $fields->{'squad'};
        $seen->{$key}=1;
        push(@ret, $fields);
    }
    return @ret;
} # nodelist2hash


