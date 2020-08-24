import React, { Component } from 'react';
import { Button, Dropdown, Menu, Icon } from 'antd';
import RGL, { WidthProvider } from "react-grid-layout";
import * as Widgets from "./Widgets/";
import WidgetWrapper from './WidgetWrapper';
import LocalStorage from '../utils/LocalStorage';
import Defaults from "./Defaults";
import "./dashboard.css";
import { getLibertyGMBuildLatestJob } from '../utils/perf';
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
        try {
            this.state = JSON.parse( this.state );
        } catch ( e ) {
            this.state = null;
        }
        if ( !this.state ) {
            this.state = this.getDefaultState();
        }
        delete this.state.loaded;
    }


    removeLocalStorage( key ) {
        this.localStorage = new LocalStorage( key );
        this.localStorage.reset();
    }

    getDefaultState() {
        const { tab } = this.props;
        return {
            layout: Defaults[tab].widgets.map(( { type, settings, ...rest }, i ) => {
                const Widget = Widgets[type];
                const { w = 1, h = 1 } = Widget.defaultSize || {};
                return { ...rest, w, h, i: i.toString() };
            } ),
            settings: Defaults[tab].widgets.map(( { type, settings, x, y, ...rest }, i ) => {
                const Widget = Widgets[type];
                return { ...rest, ...Widget.defaultSettings, type, ...settings };
            } )
        }
    }
    async componentDidMount() {
        console.log("INSIDE COMPONENT DID MOUNT");
        console.log(this.state);
        let settings = this.state.settings;
        settings.map(async (setting, key) =>  {
            if (setting != null && setting.type.includes("LibertySUFP")) {
                console.log(setting);
                console.log(key);
                const response = await fetch(`/api/getLibertyGMList`, {
                    method: 'get'
                });
                const results = await response.json();
                console.log(results);
                settings[key].libertyGMList = results;
                console.log(settings);
                this.setState( { settings: settings } );
            }
        })
        this.setState( { loaded: true } );
    }

    onRemove = i => {
        this.state.layout = this.state.layout.filter( l => l.i !== i );
        this.state.settings[i] = null;
        this.setState( this.state );
    }

    onReset = e => {
        this.setState( this.getDefaultState() );
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
        let libertyGMRelease = value;
        let libertyBaselineBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
        console.log(libertyBaselineBuildLatestJob);
        let settings = this.state.settings;
        settings[i].libertyBaselineBuild = libertyBaselineBuildLatestJob.results.libertyBuild;
        settings[i].libertyBaselineRelease = value;
        this.setState({settings: settings});
    }

    onChangeLibertyTargetRelease = async(i, value) => {
        console.log(i);
        console.log(value);
        let settings = this.state.settings;
        if(value == "All"){
            settings[i].libertyTargetBuild = value;
        } else {
            let libertyGMRelease = value;
            let libertyTargetBuildLatestJob = await getLibertyGMBuildLatestJob(libertyGMRelease);
            settings[i].libertyTargetBuild = libertyTargetBuildLatestJob.results.libertyBuild;
            console.log(libertyTargetBuildLatestJob);
        }
        settings[i].libertyTargetRelease = value;
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
        const { loaded, layout, settings } = this.state;
        if ( !loaded ) return null; // Need to skip a render as the grid needs to know the page width
        this.localStorage.set( JSON.stringify( this.state ) );

        layout.forEach( l => {
            l.x = l.x || 0;
            l.y = l.y || 0;
        } );

        const menu = <Menu onClick={this.onAddWidget}>
            {Object.keys( Widgets ).sort().map(( name, i ) => {
                return <Menu.Item key={name}>{name}</Menu.Item>
            } )}
        </Menu>

        return <div>
            <div>
                <Button type="primary" onClick={this.onReset} >Reset</Button>
                <Dropdown overlay={menu}>
                    <Button style={{ marginLeft: 8 }}>
                        Add a widget <Icon type="down" />
                    </Button>
                </Dropdown>
            </div>
            <div className="dashboard">
                <ReactGridLayout layout={layout} onLayoutChange={this.onLayoutChange} cols={4} rowHeight={125} autoSize draggableHandle=".widget--header-info">
                    {layout.map(( item, i ) => {
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
