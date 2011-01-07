require 'dbpass.pl';
$dbh = DBI->connect(
    'dbi:mysql:satyap_pardus:localhost',
    'satyap_pardus',
    $dbpass,
    {},
);

