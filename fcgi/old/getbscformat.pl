#!/usr/bin/perl

use strict;
use warnings;
use CGI;
use DBI;
require 'dbconfig.pl';

sub get_field_type($$);
sub print_sector_detail($);

our $dbh;

my $q=CGI->new();

my @id=$q->param('id');

print<<XML;
Content-type: text/plain

<?xml version="1.0" encoding="UTF-8"?>
<PARDUS SCHEMA="1.1" VERSION="0.99">
<MAP>
XML


my $sth=$dbh->prepare('SELECT `sectors`.*,clusters.cluster FROM `sectors`,`clusters` WHERE `sectors`.`cluster_id`=`clusters`.`id` AND `sectors`.id=? ORDER BY `cluster`,`name`');

my $sector;

foreach my $id(@id) {
    $sth->execute($id);
    while(my $r=$sth->fetchrow_hashref) {
        print '<SECTOR CLUSTER="'.$r->{'cluster'} .'" NAME="' . $r->{'name'} . '" X="' .$r->{'x'} . '" Y="' .$r->{'y'}. '">'."\n";
        print_sector_detail($id);
        print '</SECTOR>' . "\n";
    }
}

print<<XML;
</MAP>
</PARDUS>
XML

$dbh->disconnect;

sub print_sector_detail($) {
    my $id=shift;
    my $sth = $dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=? ORDER BY `background`');
    $sth->execute($id);
    my $fieldtype;
    my $cached=0;
    my $type='';
    while(my $r = $sth->fetchrow_hashref) {
        my $bg=$r->{'background'};
        $bg=~s/\d//g;
        unless(exists $fieldtype->{$bg}) {
            get_field_type($fieldtype, $bg);
        }
        next unless exists $fieldtype->{$bg};
        unless($type eq $fieldtype->{$bg}) {
            print "</FIELDS>\n" unless $type eq '';
            $type= $fieldtype->{$bg};
            print '<FIELDS TYPE="' . $type . '">' . "\n";
        }
        print '<F X="';
        print $r->{'x'} . '" Y="' . $r->{'y'} . '"/>' . "\n";
    }
    print "</FIELDS>\n";
    $sth->finish;
}

sub get_field_type($$) {
    my $ftype=shift;
    my $bg=shift;

    if($bg =~ /max/) {
        return;
    }
    elsif($bg =~ /energy/) {
        $ftype->{$bg}='Energy';
    }
    elsif($bg =~ /spa/) {
        $ftype->{$bg}='Hydrogen Fuel';
    }
    elsif($bg =~ /neb/) {
        $ftype->{$bg}='Nebula Gas';
    }
    elsif($bg =~ /ast/) {
        $ftype->{$bg}='Ore';
    }
    elsif($bg =~ /vir/) {
        $ftype->{$bg}='Viral Cloud';
    }
    elsif($bg =~ /em/) {
        $ftype->{$bg}='Exotic Matter';
    }

}
