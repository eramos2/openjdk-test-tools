const { TestResultsDB, ObjectID } = require( '../Database' );
module.exports = async ( req, res ) => {
    //const { url, buildName, buildNum } = req.query;
    const testResultsDB = new TestResultsDB();
    
    const data = await testResultsDB.aggregate([
        { 
            $match: {'aggregateInfo.benchmarkName':  { $in: [ /^WebsphereLibertySUFP/, /^OpenLibertySUFP/ ] } } 
        },
        {
            $project: {_id: 1, 'aggregateInfo.benchmarkName': 1}
        },
        { 
            $group: {_id: "$aggregateInfo.benchmarkName"}
        }
    ])

    console.log(data);
    if ( data[0] ) {
        let scenarios = [];
        console.log(data);
        data.map(group => {
            group._id.map(scenario => {
                if(!scenarios.includes(scenario)){
                    scenarios.push(scenario);
  
                } 
            })
        })
        res.json( {
            results: scenarios,
        } );
    } else {
        res.json( { results: undefined } );
    }
}
