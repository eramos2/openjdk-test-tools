const { TestResultsDB, ObjectID } = require( '../Database' );
module.exports = async ( req, res ) => {
    const { libertyBuild } = req.query;
    const testResultsDB = new TestResultsDB();
    
    const data = await testResultsDB.aggregate( [
        {
            $match: {
                "libertyBuild": libertyBuild,
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
