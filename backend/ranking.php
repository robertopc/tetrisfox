<?php

    ini_set( 'display_errors', 0 );

/* get first 10 positions of the ranking
SET @curRank := 0;
SELECT *, @curRank := @curRank + 1 AS rank
FROM ranking
ORDER BY record DESC, date ASC
LIMIT 10*/

    // if token setted
    if( $_GET['token'] == 'TETRISFOX' ) {

        require( 'config.php' );

        // conect with mysql
        $con = mysql_connect( $server, $user, $pass ) OR die('{"msg":"error_server_connection"}');

        // connect with database
        mysql_select_db( 'tetrisfox', $con ) OR die('{"msg":"error_database_connection"}');

        // get device id
        $device_id = $_GET['device_id'];

        // get the record
        $record = $_GET['record'];

        // get country
        $country = 0;

        // if device_id is null, the device don't was registered
        if( empty( $device_id ) ) {

            do {

                // get unique identifier
                $device_id = md5( time() );

                // insert in database
                mysql_query( "INSERT INTO ranking( device_id, record, country, date )
                              VALUES( '{$device_id}', {$record}, {$country}, NOW() )", $con );

                // check if there was the register
                $device_id = ( mysql_affected_rows( $con ) != 1 )? '' : $device_id ;

            } while( $device_id == '' );

        } else {

            do {

                // insert in database
                mysql_query( "UPDATE ranking
                              SET record = {$record},
                                  country = {$country},
                                  date = NOW()
                              WHERE device_id = '{$device_id}'", $con );

            } while( mysql_affected_rows() == 0 );
        }

        // get current position
        $query = mysql_query( "SELECT '-1' AS position
                               FROM ranking
                               WHERE device_id = '{$device_id}'", $con );

        // get current position
        $query = mysql_query( "SELECT '-1' AS position
                               FROM ranking
                               WHERE device_id = '{$device_id}'", $con );
/*
        SELECT (SELECT COUNT() FROM ranking WHERE record > R.record ORDER BY record DESC )+(1) AS position,
        R.record
        FROM ranking AS R
        ORDER BY position
*/
        $result = mysql_fetch_assoc( $query );

        $return['msg']                = "Ranking TetrisFox";
        $return['first_10_positions'] = $device_id;
        $return['device_id']          = $device_id;
        $return['position']           = $result['position'];
        $return['country']            = $country;

        print json_encode( $return );
    }
