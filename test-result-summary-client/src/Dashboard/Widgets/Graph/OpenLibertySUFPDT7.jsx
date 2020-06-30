import React, { Component } from 'react';
import {
    HighchartsChart, Chart, XAxis, YAxis, Legend,
    ColumnSeries, SplineSeries, Navigator, RangeSelector, Tooltip
} from 'react-jsx-highstock';
import DateRangePickers from '../DateRangePickers';
import { Checkbox } from 'antd';
import BenchmarkMath from '../../../PerfCompare/lib/BenchmarkMath';
import math from 'mathjs';
import utils from './utils';
import { getTwoToneColor } from 'antd/lib/icon/twoTonePrimaryColor';

const map = {
    "OpenLibertySUFPDT7": "Test_openjdk8_j9_extended.perf_x86-64_linux",
};

let display = {
    "Daytrader7": true,
};

export class Daytrader7Setting extends Component {
    onChange = obj => {
        for (let i in display) {
            display[i] = false;
        }
        for (let j in obj) {
            display[obj[j]] = true;
        }
        this.props.onChange({ buildSelected: obj[obj.length - 1] });
    }

    render() {
        return <div style={{ maxWidth: 400 }}>
            <Checkbox.Group onChange={this.onChange} values={map.keys} defaultValue={["Daytrader7"]}>
                {Object.keys(map).map(key => {
                    return <Checkbox key={key} value={key} checked={false}>{map[key]}</Checkbox>;
                })}
            </Checkbox.Group>
        </div>
    }
}

export default class Daytrader7 extends Component {
    constructor (props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    static Title = props => props.buildSelected || '';
    static defaultSize = { w: 2, h: 4 }
    static Setting = Daytrader7Setting;
    static defaultSettings = {
        buildSelected: Object.keys(map)[0]
    }
    

    state = {
        displaySeries: [],
        baselineSeries: [],
    };

    async componentDidMount() {
        await this.updateData();
    }


    async componentDidUpdate(prevProps) {
        if (prevProps.buildSelected !== this.props.buildSelected) {
            await this.updateData();
        }
    }

    async updateData() {
        const { buildSelected } = this.props;
        const buildName = encodeURIComponent(map[buildSelected]);
        const response = await fetch(`/api/getBuildHistory?type=Perf&buildName=${buildName}&status=Done&limit=100&asc`, {
            method: 'get'
        });
        const results = await response.json();
        const resultsByJDKBuild = {};
        const resultsByLibertyBuild = {};
        let activeMax = [];
        let gtValues = [];
        let std = [];
        let mean = [];
        let startupMean = [];
        let footprintMean = [];
        let firstResponseMean = [];
        let cpuUsageMean = [];
        let median = [];
        console.log("results", results);
        // combine results having the same JDK build date
        results.forEach(( t, i ) => {
            // Get builds that completed and that have liberty builds that start with 'cl'
            if ( t.buildResult !== "SUCCESS" || t.libertyBuild == null ) return;
            if ( !t.libertyBuild.startsWith("cl") ) return;
            console.log(t);
            const jdkDate = t.jdkDate;
            // Get the build without the cl
            const libertyBuildSplit = t.libertyBuild.split(/cl|-/); 
            const libertyBuildNumber = libertyBuildSplit[1] + libertyBuildSplit[2];
            const jobNum = t.buildNum;
            const timestamp = t.timestamp;
            
            resultsByLibertyBuild[libertyBuildNumber] = resultsByLibertyBuild[libertyBuildNumber] || [];
            resultsByJDKBuild[jdkDate] = resultsByJDKBuild[jdkDate] || [];
            t.tests.forEach(( test, i ) => {
                if ( !test.testName.startsWith("OpenLibertySUFPDT7") || !test.testData || !test.testData.metrics ) return;
                console.log(test.testName);
                //const libertyBuildJobKey = libertyBuildNumber + '' + timestamp;
                //resultsByLibertyBuild[libertyBuildJobKey] = resultsByLibertyBuild[libertyBuildJobKey] || [];
                //console.log(libertyBuildJobKey);
                 // TODO: current code only considers one interation. This needs to be updated
                 const metrics = test.testData.metrics[0];
                 let footprint, startup, firstResponse, cpuUsage;
                 //Get mean for the given metrics
                 test.testData.metrics.forEach((metric, j) => {
                     //console.log(metric);
                     //console.log(j);
                     //console.log(math.mean(metric.value));
                     switch (metric.name) {
                        case 'Footprint in kb':
                            footprint = math.mean(metric.value);
                            break;
                        case 'Startup time in ms':
                            startup = math.mean(metric.value);
                            break;
                        case 'First Response in ms':
                            firstResponse = math.mean(metric.value);
                            break;
                        case 'CPU Usage in secs':
                            cpuUsage = math.mean(metric.value);
                            break;
                        default:
                            return;
                     }
                 });
                 console.log(metrics);
                //if (metrics.name !== "Footprint in kb" ) return;
                resultsByJDKBuild[jdkDate].push( {
                    activeMax: metrics.value[0],
                    additionalData: {
                        testId: test._id,
                        buildName: t.buildName,
                        buildNum: t.buildNum,
                        javaVersion: t.javaVersion,
                    },
                } );
                resultsByLibertyBuild[libertyBuildNumber].push( {
                    activeMax: metrics.value[0],
                    footprint: footprint,
                    startup: startup,
                    firstResponse: firstResponse,
                    cpuUsage: cpuUsage,
                    additionalData: {
                        testId: test._id,
                        buildName: t.buildName,
                        timestamp: timestamp,
                        buildNum: t.buildNum,
                        libertyBuildNumber: libertyBuildNumber,
                        javaVersion: t.javaVersion,
                    },
                } );
                //console.log(resultsByLibertyBuild);
            });
        } );
        console.log(resultsByLibertyBuild);
        //console.log(math.sort(Object.keys( resultsByLibertyBuild )));
        math.sort( Object.keys( resultsByLibertyBuild ) ).forEach(( k, i ) => {
        console.log(resultsByLibertyBuild[k]);
        //Get results for latest ran job with 'k' build numnber
        let latestRanBuild = resultsByLibertyBuild[k].reduce((total, currentValue) => {
            if (currentValue.additionalData.timestamp > total.additionalData.timestamp){
                return currentValue;
            } else {
                return total;
            }
        });
	    let activeMaxGroup = resultsByLibertyBuild[k].map( x => x['activeMax'] );
            gtValues.push( math.mean( activeMaxGroup ) );
            let myCi = 'N/A';
            if (activeMaxGroup.length > 1){
              myCi = BenchmarkMath.confidence_interval(activeMaxGroup);
            }
            //activeMax.push( [Number( k ), math.mean( activeMaxGroup ), resultsByLibertyBuild[k].map( x => x['additionalData'] ), myCi] );

            //std.push( [Number( k ), math.std( gtValues )] );
            mean.push( [Number( k ), math.mean( gtValues )] );
            footprintMean.push( [Number( latestRanBuild.additionalData.libertyBuildNumber ), latestRanBuild.footprint, [latestRanBuild.additionalData]] );
            startupMean.push( [Number( latestRanBuild.additionalData.libertyBuildNumber ), latestRanBuild.startup, [latestRanBuild.additionalData]] );
            firstResponseMean.push( [Number( latestRanBuild.additionalData.libertyBuildNumber ), latestRanBuild.firstResponse, [latestRanBuild.additionalData]] );
            cpuUsageMean.push( [Number( latestRanBuild.additionalData.libertyBuildNumber ), latestRanBuild.cpuUsage, [latestRanBuild.additionalData]] );
            //mean.push( [Number( resultsByLibertyBuild[k].additionalData.libertyBuildNumber ), math.mean( gtValues )] );
            //median.push( [Number( k ), math.median( gtValues )] );
        } );
        console.log(footprintMean);
        //const series = { activeMax, std, mean, median };
        const series = { footprintMean, startupMean, firstResponseMean, cpuUsageMean };
        console.log(series);
        const displaySeries = [];
        for ( let key in series ) {
            displaySeries.push( {
                visible: key === "footprintMean",
                name: key,
                data: series[key],
                keys: ['x3', 'y', 'additionalData', 'CI']
            } );
        }
        this.setState( { displaySeries } );
    }

    formatter = function() {
        const x = new Date( this.x );
        console.log("Hello");
        console.log(this.point);
        const CIstr = (typeof this.point.CI === 'undefined') ? ``: `CI = ${this.point.CI}`;
        if ( this.point.additionalData ) {
            let buildLinks = '';
            let i = this.series.data.indexOf(this.point);
            let prevPoint = i === 0 ? null : this.series.data[i - 1];
            this.point.additionalData.forEach(( xy, i ) => {
                const { testId, buildName, buildNum } = xy;
                buildLinks = buildLinks + ` <a href="/output/test?id=${testId}">${buildName} #${buildNum}</a>`;
            } );

            let lengthThis = this.point.additionalData.length;
            let lengthPrev = prevPoint ? prevPoint.additionalData.length : 0;

            let javaVersion = this.point.additionalData[lengthThis - 1].javaVersion;
            let prevJavaVersion = prevPoint ? prevPoint.additionalData[lengthPrev - 1].javaVersion : null;
            let libertyBuildNumber = this.point.additionalData[lengthThis - 1].libertyBuildNumber;
            let prevLibertyBuildNumber= prevPoint ? prevPoint.additionalData[lengthPrev - 1].libertyBuildNumber : null;
            console.log(this.point.additionalData[lengthThis - 1]);
            console.log(this.x);
            console.log(this.y);
            console.log(this.series);
            console.log(prevLibertyBuildNumber);
            console.log("libNum");
            console.log(libertyBuildNumber);
            let ranDate = new Date(this.point.additionalData[lengthThis - 1].timestamp);
            //let ret = `${this.series.name}: ${this.y}<br/> Build: ${x.toISOString().slice( 0, 10 )} <pre>${javaVersion}</pre><br/>Link to builds: ${buildLinks}<br /> ${CIstr}`;
            let ret = `${this.series.name}: ${this.y}<br/> Job Date: ${ranDate}<br/> Build: cl${this.x} <pre>${javaVersion}</pre><br/>Link to builds: ${buildLinks}<br /> ${CIstr}`;
            prevJavaVersion = utils.parseSha(prevJavaVersion, 'OpenJ9');
            javaVersion = utils.parseSha(javaVersion, 'OpenJ9');

            if (prevLibertyBuildNumber && libertyBuildNumber) {
                let githubLink = `<a href="https://github.com/eclipse/openj9/compare/${prevLibertyBuildNumber}…${libertyBuildNumber}">Github Link </a>`;
                ret += `<br/> Compare Builds: ${githubLink}`;
            }
            return ret;
        } else {
            return `${this.series.name}: ${this.y}<br/> Build: ${x.toISOString().slice( 0, 10 )}<br /> ${CIstr}`;
        }
    }
    handleClick (e) {
        console.log(e);
        this.setState({baselineSeries: [e.point.y]});
    }
    render() {
        const { displaySeries, baselineSeries } = this.state;
        //console.log(displaySeries);
        //console.log(baselineSeries);
        //Add if statement 
        let categories;
        if (displaySeries[0] != undefined && displaySeries[0].hasOwnProperty('data')){
            categories = displaySeries[0].data.map(s => {return s[0]});
            //console.log(categories);
        } 
        
        const plotOptions = {
            cursor: 'pointer',
            events: {
                click: function (event) {
                    alert(this.name + ' ' +event.altKey);
                    console.log(event);
                    console.log("Hello");
                } 
            },
            column: {
              pointPadding: 0.2,
              borderWidth: 0
            },
            spline: {
                lineWidth: 4
            }
          };
        return <HighchartsChart plotOptions={plotOptions}>
            {/* <Chart zoomType="x" height="50%" /> */}
            <Chart type="spline" />

            <Legend />
            <Tooltip formatter={this.formatter} useHTML={true} style={{ pointerEvents: 'auto' }} />

            <XAxis categories={categories} >
                <XAxis.Title>Build</XAxis.Title>
            </XAxis>

            <YAxis id="gt" plotLines={this.state.baselineSeries.length === 1 ? [{color: 'red', width: 2, value: this.state.baselineSeries, dashStyle: 'longdashdot'}] : [{}]}>
                <YAxis.Title>Footprint</YAxis.Title>
                {displaySeries.map( s => {
                    return <ColumnSeries {...s} id={s.name} key={s.name} onClick={this.handleClick}/>
                } )}
                {/* <ColumnSeries name="Installation" data={[1, 2, 3]} />
                <ColumnSeries name="footprint" data={[3, 2, 1]} />
                <ColumnSeries name="startup" data={[1, 3, 2]} /> */}
            </YAxis>

            {/* <DateRangePickers axisId="xAxis" />
            <RangeSelector>
                <RangeSelector.Button count={1} type="day">1d</RangeSelector.Button>
                <RangeSelector.Button count={7} type="day">7d</RangeSelector.Button>
                <RangeSelector.Button count={1} type="month">1m</RangeSelector.Button>
                <RangeSelector.Button type="all">All</RangeSelector.Button>
            </RangeSelector> */}

            <Navigator>
                <Navigator.Series seriesId="activeMax" />
                <Navigator.Series seriesId="mean" />
            </Navigator>
        </HighchartsChart>
    }
}
