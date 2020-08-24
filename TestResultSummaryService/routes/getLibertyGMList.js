const { TestResultsDB, ObjectID } = require( '../Database' );
module.exports = async ( req, res ) => {
    //const { url, buildName, buildNum } = req.query;
    const testResultsDB = new TestResultsDB();
    
    const data = await testResultsDB.aggregate([
        { 
            $match: { libertyGMRelease: { $not: { $eq: null}}}
        },
        {
            $project: {_id: 1, libertyGMRelease: 1, libertyBuild: 1}
        },
        { 
            $group: {_id: "$libertyGMRelease"}
        }, 
        {
            $sort: {_id: 1 }
        }
    ])
    console.log(data);
    if ( data[0] ) {
        res.json( {
            results: data,
        } );
    } else {
        res.json( { results: undefined } );
    }
}
