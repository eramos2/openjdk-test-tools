import React, { Component } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Select } from 'antd';
import RGL, { WidthProvider } from "react-grid-layout";
import * as Widgets from "./Widgets/";
import WidgetWrapper from './WidgetWrapper';
import LocalStorage from '../utils/LocalStorage';
import Defaults from "./Defaults";
import "./dashboard.css";
import { getLibertyGMBuildLatestJob, getLibertyScenarios } from '../utils/perf';
const ReactGridLayout = WidthProvider( RGL );

export default class TabInfo extends Component {
    static VERSION = 7;
    constructor( props ) {
        super( props );
        const localKey = `dashboard-${props.tab}`;
        for ( let i = 0; i < TabInfo.VERSION - 1; i++ ) {
            this.removeLocalStorage( `${localKey}-v${i}` );
        }
        this.localStorage = new LocalStorage( `${localKey}-v${TabInfo.VERSION}` );
        this.state = this.localStorage.get();
        console.log("Initial state", this.state);
        try {
            this.state = JSON.parse( this.state );
            console.log("GEtting state");
            console.log(this.state);
        } catch ( e ) {
            this.state = null;
        }
        console.log(props);
        if ( !this.state ) {
            
            if (props.tab == 'Perf'){
                //this.getDefaultState().then(res => {console.log(res); this.state = res});
                console.log(this.state);
                this.state = this.getDefaultState().then(response => { return response });
                console.log(this.state);
            } else {
                console.log("ELSE")
                this.state = this.getDefaultState();
                console.log("ELSE STATE", this.state);
            }
            
            console.log("No State");
            console.log(this.state)
        }
        delete this.state.loaded;
    }


    removeLocalStorage( key ) {
        this.localStorage = new LocalStorage( key );
        this.localStorage.reset();
    }

    getDefaultState() {
        const { tab } = this.props;
        console.log(tab);
        let libertyScenarios = {};
        if (tab == 'Perf') {
            return getLibertyScenarios().then(response => {
                libertyScenarios = response;
                console.log(libertyScenarios);
            libertyScenarios.results != undefined ? libertyScenarios = libertyScenarios.results : libertyScenarios = [];
            //let layout = [];
            const widgetType = 'LibertySUFP';
            
            const w = 2;
            const h = 4; 
            let x = 0;
            let y = 2;
            return {
                layout: libertyScenarios.map((name, i) => {
                    console.log(i, name);
                    //Will widget go on right or left column? x = 0 -> left ,x = 2 -> right
                    x = i % 2 == 0 ? 0 : 2;   
                    //We need to increase y axis by 4 for every 2 widgets 
                    y = y + (Math.trunc(i/2) * 4);
                    return { x, y, w, h, buildSelected: name, i: i.toString() };
                }),
                settings: libertyScenarios.map((name, i) => {
                    console.log(i, name);
                    //Will widget go on right or left column? x = 0 -> left ,x = 2 -> right
                    x = i % 2 == 0 ? 0 : 2;   
                    //We need to increase y axis by 4 for every 2 widgets 
                    y = y + (Math.trunc(i/2) * 4);
                    return { x, y, w, h, buildSelected: name, type: widgetType, i: i.toString() };
                }),
                libertyScenarios: libertyScenarios
            }
            }) ;
            
         } else {
            return {
                layout: Defaults[tab].widgets.map(( { type, settings, ...rest }, i ) => {
                    const Widget = Widgets[type];
                    console.log(Widget);
                    console.log(rest);
                    console.log(Widget.defaultSettings);
                    const { w = 1, h = 1 } = Widget.defaultSize || {};
                    return { ...rest, w, h, i: i.toString() };
                } ),
                settings: Defaults[tab].widgets.map(( { type, settings, x, y, ...rest }, i ) => {
                    const Widget = Widgets[type];
                    return { ...rest, ...Widget.defaultSettings, type, ...settings };
                } ),
                libertyScenarios: libertyScenarios
    
            }
         }

        
    }

    componentWillMount() {
        //let libertyScenarios = getLibertyScenarios();
        const { tab } = this.props;
        if (tab == 'Perf') {
            getLibertyScenarios().then(result => {console.log(result)}).catch(function (error) {
                console.log(error.message);
            });
        }
        //libertyScenarios.results != undefined ? libertyScenarios = libertyScenarios.results[0]._id : libertyScenarios = [];
        //this.setState({libertyScenarios: libertyScenarios});
    }
    async componentDidMount() {
        const { tab } = this.props;
        let { libertyBaselineRelease, libertyTargetRelease } = this.state;

        console.log("INSIDE COMPONENT DID MOUNT");
        let libertyScenarios = {};
        let libertyGMList = [];
        if (tab == 'Perf') {
            //const { libertyScenarios } = this.state;
            const response = await fetch(`/api/getLibertyGMList`, {
                method: 'get'
            });
            libertyGMList = await response.json();
            console.log(libertyGMList);
            let libertyGMListFirst = libertyGMList.results != undefined && libertyGMList.results.length > 0 ? libertyGMList.results[0] : undefined;
            libertyBaselineRelease = libertyBaselineRelease != undefined ? libertyBaselineRelease : libertyGMListFirst._id;
            libertyTargetRelease = libertyTargetRelease != undefined ? libertyTargetRelease : 'All';
            this.setState({ libertyGMList: libertyGMList, libertyBaselineRelease: libertyBaselineRelease, libertyTargetRelease: libertyTargetRelease })
        }
        
        console.log(libertyScenarios);
        console.log(libertyGMList);
        //libertyScenarios.results != undefined ? libertyScenarios = libertyScenarios.results : libertyScenarios = [];
        //this.setState({libertyScenarios: libertyScenarios});
        console.log(this.state);
        console.log(this.props);

        let settings = this.state.settings;
        console.log(settings);
        if ( settings != undefined ){settings.map(async (setting, key) =>  {
            if (setting != null && setting.type.includes("LibertySUFP")) {
                console.log(setting);
                console.log(key);
                
                //const results = await response.json();
                console.log(libertyGMList);
                settings[key].libertyGMList = libertyGMList;
                console.log(settings);
                this.setState( { settings: settings } );
            }
        })}
        this.setState( { loaded: true } );
    }

    onRemove = i => {
        this.state.layout = this.state.layout.filter( l => l.i !== i );
        this.state.settings[i] = null;
        this.setState( this.state );
    }

    onReset = e => {
        const { tab } = this.props;
        if (tab == 'Perf') {
            this.getDefaultState().then(res => {
                this.setState( res );
            });
        } else {
            this.setState( this.getDefaultState() );
        }
        
        console.log("RESET");
        console.log(this.state);
    }

    onLayoutChange = layout => {
        this.setState( { layout } );
    }

    onChange = ( i, value ) => {
        this.state.settings[i] = { ...this.state.settings[i], ...value }
        this.setState( this.state );
    }

   onChangeLibertyBaselineRelease = async (i, value) => {
        console.log(i);
        console.log(value);
        let settings = this.state.settings;
        if(value._owner != undefined){
            let libertyGMRelease = value.props.value;
            let libertyBaselineBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
            settings.map(setting => {
                setting.libertyBaselineBuild = libertyBaselineBuildLatestJob.results.libertyBuild;
                setting.libertyBaselineRelease = libertyGMRelease;
            })

        } else {
            let libertyGMRelease = value;
            let libertyBaselineBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
            console.log(libertyBaselineBuildLatestJob);
            settings[i].libertyBaselineBuild = libertyBaselineBuildLatestJob.results.libertyBuild;
            settings[i].libertyBaselineRelease = value;
        }
        
        this.setState({settings: settings});
    }

    onChangeLibertyTargetRelease = async(i, value) => {
        console.log(i);
        console.log(value);
        let settings = this.state.settings;
        if(value._owner != undefined){
            let libertyGMRelease = value.props.value;
            let libertyTargetBuildLatestJob;
            if(libertyGMRelease != "All"){
                libertyTargetBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
            }
            settings.map(setting => {
                if(libertyGMRelease == "All"){
                    setting.libertyTargetBuild = libertyGMRelease;
                    setting.libertyTargetRelease = libertyGMRelease;
                } else {
                    setting.libertyTargetBuild = libertyTargetBuildLatestJob.results.libertyBuild;
                    setting.libertyTargetRelease = libertyGMRelease;
                }
            })
        } else {
            if(value == "All"){
                settings[i].libertyTargetBuild = value;
            } else {
                let libertyGMRelease = value;
                let libertyTargetBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
                settings[i].libertyTargetBuild = libertyTargetBuildLatestJob.results.libertyBuild;
                console.log(libertyTargetBuildLatestJob);
                settings[i].libertyTargetRelease = value;
            }
        }
        
        
        this.setState({settings: settings});
    }

    onAddWidget = e => {
        const length = this.state.settings.length;
        const Widget = Widgets[e.key];
        const { w = 1, h = 1 } = Widget.defaultSize;
        const item = { x: 0, y: 0, w, h, i: length.toString(), type: e.key, }

        // Must create a new layout widget, if we don't, new elements have a size of 1x1
        this.setState( {
            layout: [...this.state.layout, item],
            settings: [...this.state.settings, { ...Widget.defaultSettings, type: e.key }],
        } );
    }

    render() {
        const { loaded, layout, settings, libertyScenarios, libertyGMList, libertyBaselineRelease, libertyTargetRelease} = this.state;
        const { tab } = this.props
        const { Option } = Select;
        let isPerfTab = tab == 'Perf' ? true : false;
        let selectLibertyBaselineRelease = libertyBaselineRelease != undefined ? libertyBaselineRelease : "default";
        let selectLibertyTargetRelease = libertyTargetRelease != undefined ? libertyTargetRelease : "All";
        
        if ( !loaded ) return null; // Need to skip a render as the grid needs to know the page width
        this.localStorage.set( JSON.stringify( this.state ) );
        console.log("layout",layout);
        if (layout != undefined) {
            layout.forEach( l => {
            l.x = l.x || 0;
            l.y = l.y || 0;
           } );
        }
        console.log(Widgets);
        let menu = <Menu onClick={this.onAddWidget}>
            {Object.keys( Widgets ).sort().map(( name, i ) => {
                return <Menu.Item key={name}>{name}</Menu.Item>
            } )}
            {isPerfTab && libertyScenarios && libertyScenarios.map(name => {
                return <Menu.Item key={name}>{name}</Menu.Item>
            }) }
            
        </Menu>

        
        return <div>
            <div>
                <Button type="primary" onClick={this.onReset} >Reset</Button>
                <Dropdown overlay={menu}>
                    <Button style={{ marginLeft: 8 }}>
                        Add a widget <DownOutlined />
                    </Button>
                </Dropdown>
                {console.log("Select me ", selectLibertyBaselineRelease)}
                {isPerfTab && <Select defaultValue={selectLibertyBaselineRelease} onChange={this.onChangeLibertyBaselineRelease}>
                <Option value="default">Select a Baseline Release</Option>
                {console.log("HELLOUUASDAS", libertyGMList)}
                {libertyGMList && libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
                {console.log("HELLOUUASFINSHEDDAS", libertyGMList)}
            </Select>}
            {console.log(selectLibertyTargetRelease)}
            {isPerfTab && <Select defaultValue={selectLibertyTargetRelease} onChange={this.onChangeLibertyTargetRelease}>
                <Option value="default">Select a Target Release</Option>
                <Option value="All">All Releases</Option>
                {console.log("HELGOTIUASDSDAS", libertyGMList)}
                {libertyGMList && libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
                {console.log("HELLFINSHEDSAOUUASDAS", libertyGMList)}
            </Select>}
            </div>

            <div className="dashboard">
                <ReactGridLayout layout={layout} onLayoutChange={this.onLayoutChange} cols={4} rowHeight={125} autoSize draggableHandle=".widget--header-info">
                    {/* {console.log("layout", layout)} */}
                    {layout && layout.map(( item, i ) => {
                        const setting = settings[item.i];
                        if ( !setting ) return <div key={item.i} />;
                        const Widget = Widgets[setting.type];
                        if ( !Widget ) return <div key={item.i} />;
                        return <div key={item.i}>
                            <WidgetWrapper Widget={Widget} {...setting} onRemove={this.onRemove.bind( null, item.i )} onChange={this.onChange.bind( null, item.i )} onChangeLibertyBaselineRelease={this.onChangeLibertyBaselineRelease.bind(null, item.i )} onChangeLibertyTargetRelease={this.onChangeLibertyTargetRelease.bind(null, item.i )}/>
                        </div>
                    } )}
                </ReactGridLayout>
            </div>
        </div>
    }
}
