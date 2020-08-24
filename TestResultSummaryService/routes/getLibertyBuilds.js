const { TestResultsDB, ObjectID } = require( '../Database' );
module.exports = async ( req, res ) => {
    //const { url, buildName, buildNum } = req.query;
    const testResultsDB = new TestResultsDB();
    
    const data = await testResultsDB.aggregate([{$project: {_id: 1, libertyBuild: 1}},{ $group: {_id: "$libertyBuild"}}, {$sort: {_id: 1}}])
    console.log(data);
    if ( data[0] ) {
        res.json( {
            results: data,
        } );
    } else {
        res.json( { results: undefined } );
    }
}
