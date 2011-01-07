%universes = (
    'orion' => 1,
    'pegasus' => 2,
    'artemis' => 3,
);
# default cluster ids for new sectors
%uni_ids = (
    orion => 1,
    pegasus => 17, 
    artemis => 33
);

%runiverses = map {$universes{$_} => $_ } keys(%universes);

%fill=(
    emax => '#115588',
    energy => '#0e2944',
    neb=> '#cc0000',
    spa => '#000000',
    ast=> '#cccccc',
    vir => '#00ff00',
    em => '#00cc00',
    sb => '#cc9933',
);

$costs={
    spa=>0,
    neb=>1,
    ast=>2,
    energy=>3,
    em=>4,
    vir=>5,
    sb => 6,
};


%tile2name=(
'foregrounds/wormhole.gif' => 'Wormhole',

'foregrounds/asteroid_mine.png' => 'B Asteroid mine',
'foregrounds/asteroid_mine_tradeoff.png' => 'B Asteroid mine (trade off)',
'foregrounds/battleweapons_factory.png' => 'B Battleweapons factory',
'foregrounds/battleweapons_factory_tradeoff.png' => 'B Battleweapons factory (trade off)',
'foregrounds/brewery.png' => 'B Brewery',
'foregrounds/brewery_tradeoff.png' => 'B Brewery (trade off)',
'foregrounds/chemical_laboratory.png' => 'B Chemical laboratory',
'foregrounds/chemical_laboratory_tradeoff.png' => 'B Chemical laboratory (trade off)',
'foregrounds/clod_generator.png' => 'B Clod generator',
'foregrounds/clod_generator_tradeoff.png' => 'B Clod generator (trade off)',
'foregrounds/cybernetic_station.png' => 'B Cybernetic station',
'foregrounds/droid_assembly_complex.png' => 'B Droid assembly complex',
'foregrounds/droid_assembly_complex_tradeoff.png' => 'B Droid assembly complex (trade off)',
'foregrounds/drug_station.png' => 'B Drug station',
'foregrounds/drug_station_tradeoff.png' => 'B Drug station (trade off)',
'foregrounds/electronics_facility.png' => 'B Electronics facility',
'foregrounds/electronics_facility_tradeoff.png' => 'B Electronics facility (trade off)',
'foregrounds/energy_well.png' => 'B Energy well',
'foregrounds/energy_well_tradeoff.png' => 'B Energy well (trade off)',
'foregrounds/fuel_collector.png' => 'B Fuel collector',
'foregrounds/fuel_collector_tradeoff.png' => 'B Fuel collector (trade off)',
'foregrounds/gas_collector.png' => 'B Gas collector',
'foregrounds/gas_collector_tradeoff.png' => 'B Gas collector (trade off)',
'foregrounds/handweapons_factory.png' => 'B Handweapons factory',
'foregrounds/handweapons_factory_tradeoff.png' => 'B Handweapons factory (trade off)',
'foregrounds/leech_nursery.png' => 'B Leech nursery',
'foregrounds/leech_nursery_tradeoff.png' => 'B Leech nursery (trade off)',
'foregrounds/medical_laboratory.png' => 'B Medical laboratory',
'foregrounds/medical_laboratory_tradeoff.png' => 'B Medical laboratory (trade off)',
'foregrounds/nebula_plant.png' => 'B Nebula plant',
'foregrounds/nebula_plant_tradeoff.png' => 'B Nebula plant (trade off)',
'foregrounds/optics_research_center.png' => 'B Optics research center',
'foregrounds/optics_research_center_tradeoff.png' => 'B Optics research center (trade off)',
'foregrounds/plastics_facility.png' => 'B Plastics facility',
'foregrounds/plastics_facility_tradeoff.png' => 'B Plastics facility (trade off)',
'foregrounds/radiation_collector.png' => 'B Radiation collector',
'foregrounds/radiation_collector_tradeoff.png' => 'B Radiation collector (trade off)',
'foregrounds/recyclotron.png' => 'B Recyclotron',
'foregrounds/recyclotron_tradeoff.png' => 'B Recyclotron (trade off)',
'foregrounds/robot_factory.png' => 'B Robot factory',
'foregrounds/robot_factory_tradeoff.png' => 'B Robot factory (trade off)',
'foregrounds/slave_camp.png' => 'B Slave camp',
'foregrounds/slave_camp_tradeoff.png' => 'B Slave camp (trade off)',
'foregrounds/smelting_facility_federation.png' => 'B Smelting facility federation',
'foregrounds/smelting_facility.png' => 'B Smelting facility',
'foregrounds/smelting_facility_tradeoff.png' => 'B Smelting facility (trade off)',
'foregrounds/space_farm.png' => 'B Space farm',
'foregrounds/space_farm_tradeoff.png' => 'B Space farm (trade off)',

'foregrounds/trade_outpost.png' => 'B Trade outpost',
'foregrounds/trade_outpost_tradeoff.png' => 'B Trade outpost (trade off)',

'foregrounds/research_station.png' => 'B Research station',
'foregrounds/hidden_laboratory.png' => 'B Hidden laboratory',

'foregrounds/military_outpost_federation.png' => 'Military outpost federation',
'foregrounds/military_outpost_federation_tradeoff.png' => 'Military outpost federation (trade off)',
'foregrounds/military_outpost.png' => 'Military outpost',
'foregrounds/military_outpost_tradeoff.png' => 'Military outpost (trade off)',

'foregrounds/lucidi_mo.png' => 'Lucidi MO',
'foregrounds/lucidi_mo_tradeoff.png' => 'Lucidi MO (trade off)',
'foregrounds/lucidi_station1.png' => 'Lucidi station',
'foregrounds/lucidi_station2.png' => 'Lucidi station',

'foregrounds/pardus_station1.png' => 'Pardus station',

'foregrounds/wreck_001.png' => 'Wreck',
'foregrounds/wreck_002.png' => 'Wreck',
'foregrounds/wreck_003.png' => 'Wreck',
'foregrounds/wreck_004.png' => 'Wreck',
'foregrounds/wreck_050.png' => 'Wreck',
'foregrounds/wreck_051.png' => 'Wreck',
'foregrounds/wreck_052.png' => 'Wreck',
'foregrounds/wreck_053.png' => 'Wreck',
'foregrounds/wreck_054.png' => 'Wreck',
'foregrounds/wreck_055.png' => 'Wreck',
'foregrounds/wreck_056.png' => 'Wreck',
'foregrounds/wreck_057.png' => 'Wreck',
'foregrounds/wreck_058.png' => 'Wreck',
'foregrounds/wreck_059.png' => 'Wreck',
'foregrounds/wreck_150.png' => 'Wreck',
'foregrounds/wreck_151.png' => 'Wreck',
'foregrounds/wreck_152.png' => 'Wreck',
'foregrounds/wreck_153.png' => 'Wreck',
'foregrounds/wreck_154.png' => 'Wreck',
'foregrounds/wreck_155.png' => 'Wreck',
'foregrounds/wreck_156.png' => 'Wreck',
'foregrounds/wreck_225.png' => 'Wreck',

'foregrounds/sb_center_e.png' => 'SB Center e',
'foregrounds/sb_center_ne.png' => 'SB Center ne',
'foregrounds/sb_center_n.png' => 'SB Center n',
'foregrounds/sb_center_nw.png' => 'SB Center nw',
'foregrounds/sb_center_se.png' => 'SB Center se',
'foregrounds/sb_center_s.png' => 'SB Center s',
'foregrounds/sb_center_sw.png' => 'SB Center sw',
'foregrounds/sb_center_w.png' => 'SB Center w',
'foregrounds/sb_commcenter.png' => 'SB Command',
'foregrounds/sb_defense_artillery_1.png' => 'SB Defense artillery',
'foregrounds/sb_defense_artillery_3.png' => 'SB Defense artillery',
'foregrounds/sb_heavy_defense_artillery_3.png' => 'SB Heavy defense artillery',
'foregrounds/sb_heavy_defense_artillery_4.png' => 'SB Heavy defense artillery',
'foregrounds/sb_light_defense_artillery_1.png' => 'SB Light defense artillery',
'foregrounds/sb_repair_facility_hor.png' => 'SB Repair facility',
'foregrounds/sb_repair_facility_ver.png' => 'SB Repair facility',
'foregrounds/sb_shipyard_medium_ver.png' => 'SB Shipyard medium',
'foregrounds/sb_special_equipment_factory_hor.png' => 'SB Special equipment factory',
'foregrounds/sb_weapons_factory_hor.png' => 'SB Weapons factory',
'foregrounds/sb_weapons_factory_ver.png' => 'SB Weapons factory',
'foregrounds/starbase_f1_s1.png' => 'SB f1 s1',
'foregrounds/starbase_f1_s2.png' => 'SB f1 s2',
'foregrounds/starbase_f1_s3.png' => 'SB f1 s3',
'foregrounds/starbase_f1_s4.png' => 'SB f1 s4',
'foregrounds/starbase_f2_s1.png' => 'SB f2 s1',
'foregrounds/starbase_f2_s2.png' => 'SB f2 s2',
'foregrounds/starbase_f2_s3.png' => 'SB f2 s3',
'foregrounds/starbase_f2_s4.png' => 'SB f2 s4',
'foregrounds/starbase_f3_s1.png' => 'SB f3 s1',
'foregrounds/starbase_f3_s2.png' => 'SB f3 s2',
'foregrounds/starbase_f3_s3.png' => 'SB f3 s3',
'foregrounds/starbase_f3_s4.png' => 'SB f3 s4',
'foregrounds/starbase_p0_s1.png' => 'SB p0 s1',
'foregrounds/starbase_p0_s2.png' => 'SB p0 s2',
'foregrounds/starbase_p0_s3.png' => 'SB p0 s3',
'foregrounds/starbase_p0_s4.png' => 'SB p0 s4',
'foregrounds/starbase_p1_s1.png' => 'SB p1 s1',
'foregrounds/starbase_p1_s2.png' => 'SB p1 s2',
'foregrounds/starbase_p1_s3.png' => 'SB p1 s3',
'foregrounds/starbase_p1_s4.png' => 'SB p1 s4',
'foregrounds/starbase_p2_s1.png' => 'SB p2 s1',
'foregrounds/starbase_p2_s2.png' => 'SB p2 s2',
'foregrounds/starbase_p2_s3.png' => 'SB p2 s3',
'foregrounds/starbase_p2_s4.png' => 'SB p2 s4',
'foregrounds/starbase_p3_s1.png' => 'SB p3 s1',
'foregrounds/starbase_p3_s2.png' => 'SB p3 s2',
'foregrounds/starbase_p3_s3.png' => 'SB p3 s3',
'foregrounds/starbase_p3_s4.png' => 'SB p3 s4',
);

%monsters=();
%monsters_by_id=();


my $sth=$dbh->prepare('SELECT * FROM `monsters`');
$sth->execute();
while(my $r=$sth->fetchrow_hashref) {
    $tile2name{$r->{'signature'}} = $r->{'name'};
    $monsters{$r->{'signature'}} = $r->{'id'};
    $monsters_by_id{$r->{'id'}} = $r->{'name'};
}
$sth->finish;


1;
__END__
'foregrounds/planet_a.png' => 'Planet A Class',
'foregrounds/planet_d.png' => 'Planet D Class',
'foregrounds/planet_g.png' => 'Planet G Class',
'foregrounds/planet_i.png' => 'Planet I Class',
'foregrounds/planet_m.png' => 'Planet M Class',
'foregrounds/planet_r.png' => 'Planet R Class',


'foregrounds/wormhole.png' => 'Wormhole',
'foregrounds/wormholeseal_closed.png' => 'Wormholeseal closed',
'foregrounds/wormholeseal_open.png' => 'Wormholeseal open',
'foregrounds/xhole.png' => 'B Xhole',
'foregrounds/yhole.png' => 'B Yhole',
