const { TestResultsDB, ObjectID } = require( '../Database' );
module.exports = async ( req, res ) => {
    const { libertyGMRelease } = req.query;
    const testResultsDB = new TestResultsDB();
    
    const data = await testResultsDB.aggregate( [
        {
            $match: {
                "libertyGMRelease": libertyGMRelease,
            }
        },
        {
            $sort: {
                timestamp: -1,
            }
        },
        {
            $limit: 1
        }
    ] );
    console.log(data);
    if ( data[0] ) {
        res.json( {
            results: data[0],
        } );
    } else {
        res.json( { results: undefined } );
    }
}
