
export const getBenchmarkMetricProps = async (benchmarkName) => {
    let parserProps = await fetch( `/api/getBenchmarkMetricProps?benchmarkName=${benchmarkName}`, {
            method: 'get'
        }
    );
    parserProps = await parserProps.json();
    return parserProps;
}

export const getLibertyBuilds = async () => {
    let libertyBuilds = await fetch( `/api/getLibertyBuilds`, {
            method: 'get'
        }
    );
    libertyBuilds = await libertyBuilds.json();
    return libertyBuilds;
}

export const getLibertyBuilLatestJob = async (libertyBuild) => {
    let libertyBuildLatestJob = await fetch( `/api/getLibertyBuildLatestJob?libertyBuild=${libertyBuild}`, {
            method: 'get'
        }
    );
    libertyBuildLatestJob = await libertyBuildLatestJob.json();
    return libertyBuildLatestJob;
}


export const getLibertyGMBuildLatestJob = async (libertyGMRelease) => {
    let libertyGMBuildLatestJob = await fetch( `/api/getLibertyGMBuildLatestJob?libertyGMRelease=${libertyGMRelease}`, {
            method: 'get'
        }
    );
    libertyGMBuildLatestJob = await libertyGMBuildLatestJob.json();
    return libertyGMBuildLatestJob;
}

export const getLibertyScenarios = async () => {
    let libertyScenarios = await fetch( `/api/getLibertyScenarios`, {
            method: 'get'
        }
    );
    libertyScenarios = await libertyScenarios.json();
    return libertyScenarios;
}
