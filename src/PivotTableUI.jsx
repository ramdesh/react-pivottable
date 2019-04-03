import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {PivotData, sortAs, getSort} from './Utilities';
import PivotTable from './PivotTable';
import Sortable from 'react-sortablejs';
import Draggable from 'react-draggable';
import Collapsible from 'react-collapsible';
import SearchFilterUI from "./SearchFilterView";
import Tooltip from 'react-tooltip-lite';
import Checkbox from '@material/react-checkbox';
import MaterialIcon from '@material/react-material-icon';
import * as HelpConstants from './HelpConstants';

import "@material/react-checkbox/dist/checkbox.css";
import '@material/react-material-icon/dist/material-icon.css'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export class DraggableAttribute extends React.Component {
  constructor(props) {
    super(props);
    this.state = {open: false, filterText: '', showTooltip : false};
  }

  toggleValue(value) {
    if (value in this.props.valueFilter) {
      this.props.removeValuesFromFilter(this.props.name, [value]);
    } else {
      this.props.addValuesToFilter(this.props.name, [value]);
    }
  }

  matchesFilter(x) {
    return x
      .toLowerCase()
      .trim()
      .includes(this.state.filterText.toLowerCase().trim());
  }

  selectOnly(e, value) {
    e.stopPropagation();
    this.props.setValuesInFilter(
      this.props.name,
      Object.keys(this.props.attrValues).filter(y => y !== value)
    );
  }

  getFilterBox() {
    const showMenu =
      Object.keys(this.props.attrValues).length < this.props.menuLimit;

    const values = Object.keys(this.props.attrValues);
    const shown = values
      .filter(this.matchesFilter.bind(this))
      .sort(this.props.sorter);

    return (
      <Draggable handle=".pvtDragHandle">
        <div
          className="pvtFilterBox"
          style={{
            display: 'block',
            cursor: 'initial',
            zIndex: this.props.zIndex
          }}
          onClick={() => this.props.moveFilterBoxToTop(this.props.name)}
        >
          <a onClick={() => this.setState({open: false})} className="pvtCloseX">
            ×
          </a>
          <span className="pvtDragHandle">⠿</span>
          <h4>{this.props.name}</h4>


          {showMenu || <p>(too many values to show)</p>}

          {showMenu && (
            <p>
              <input
                type="text"
                placeholder="Filter values"
                className="pvtSearch"
                value={this.state.filterText}
                onKeyUp={ e => {
                  let code = e.charCode || e.keyCode;
                  if(code === 27 && this.state.filterText === ""){
                    this.setState({open: false});
                  } else if (code === 27) {
                    this.setState({
                      filterText: "",
                    })
                  } 
                }}
                onChange={e =>
                  this.setState({
                    filterText: e.target.value,
                  })
                }
              />
              <br />
              <a
                role="button"
                className="pvtButton"
                onClick={() =>
                  this.props.removeValuesFromFilter(
                    this.props.name,
                    Object.keys(this.props.attrValues).filter(
                      this.matchesFilter.bind(this)
                    )
                  )
                }
              >
                Select {values.length === shown.length ? 'All' : shown.length}
              </a>{' '}
              <a
                role="button"
                className="pvtButton"
                onClick={() =>
                  this.props.addValuesToFilter(
                    this.props.name,
                    Object.keys(this.props.attrValues).filter(
                      this.matchesFilter.bind(this)
                    )
                  )
                }
              >
                Deselect {values.length === shown.length ? 'All' : shown.length}
              </a>
            </p>
          )}

          {showMenu && (
            <div className="pvtCheckContainer">
              {shown.map(x => (
                <p
                  key={x}
                  onClick={() => this.toggleValue(x)}
                  className={x in this.props.valueFilter ? '' : 'selected'}
                >
                  <Checkbox
                    nativeControlId={x.replace(' ','').toLowerCase()}
                    checked={x in this.props.valueFilter ? false : true }
                    onChange={(e) => this.toggleValue(x)}
                  />

                  <label htmlFor={x.replace(' ','').toLowerCase()}>{x === '' ? <em>null</em> : x}</label>
                </p>
              ))}
            </div>
          )}
        </div>
      </Draggable>
    );
  }

  toggleFilterBox() {
    this.setState({ open: !this.state.open});
    this.props.moveFilterBoxToTop(this.props.name);
  }

  hideTooltips(){
    this.setState({ showTooltip: false});
  }

  showTooltips(){
    this.setState({ showTooltip: true});
  }


  render() {
    let chevronClass = (this.state.open === false) ? "pvt-attr-chevron-down" : "pvt-attr-chevron-up"
    chevronClass += (this.props.isSelected === false) ? " pvt-attr-close-hidden" : " pvt-attr-close-visible";
    const filtered =
      Object.keys(this.props.valueFilter).length !== 0
        ?  (<span className= {(this.props.isSelected === false) ? "pvtTriangleHide" : "pvtTriangle"}>
          <MaterialIcon icon="filter_list" className="pvtIcon"/></span>)
        : (<span></span>);
    /*if(!this.props.isSelected) {
      this.props.clearFilters(this.props.name);
    }*/
    return (
      <li data-id={this.props.name}>
        <span className={'pvtAttr'} onDrag={this.hideTooltips.bind(this)} onMouseOver={this.showTooltips.bind(this)}
              onMouseLeave={this.hideTooltips.bind(this)} onDrop={this.showTooltips.bind(this)}>
          <Tooltip content={this.props.name} hoverDelay={200} useHover={this.state.showTooltip}>
          <div className="pvt-braille-pattern">⠿</div>
          <div className="pvt-attr-container">
            <div className={(this.props.isSelected === false) ? "pvt-attr-text-container-left" : "pvt-attr-text-container"}
                 data-tip={this.props.name}>{filtered} {this.props.name}
            </div>
            <span
              className={(this.props.isSelected === false) ? "pvt-attr-close-hidden" : "pvt-attr-close-visible"}
              onClick={ ()=> {

                if (this.props.cols.indexOf(this.props.name) !== -1) {
                  this.props.onUpdateProperties(
                    {
                      cols: {$set: this.props.cols.filter( (item) => { return item !== this.props.name})}
                    }
                    );
                } else if (this.props.rows.indexOf(this.props.name) !== -1) {
                  this.props.onUpdateProperties(
                    {
                      rows: {$set: this.props.rows.filter( (item) => { return item !== this.props.name})}
                    }
                    );
                }
              }}
            >
              {'   '}
              ✕
            </span>
            <span className={chevronClass} onClick={this.toggleFilterBox.bind(this)}>▾</span> 
          </div>
          </Tooltip>
        </span>
        {this.state.open ? this.getFilterBox() : null}
      </li>
    );
  }
}

DraggableAttribute.defaultProps = {
  valueFilter: {},
};

DraggableAttribute.propTypes = {
  name: PropTypes.string.isRequired,
  addValuesToFilter: PropTypes.func.isRequired,
  removeValuesFromFilter: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  attrValues: PropTypes.objectOf(PropTypes.number).isRequired,
  valueFilter: PropTypes.objectOf(PropTypes.bool),
  moveFilterBoxToTop: PropTypes.func.isRequired,
  sorter: PropTypes.func.isRequired,
  menuLimit: PropTypes.number,
  zIndex: PropTypes.number,
};

export class Dropdown extends React.PureComponent {
  render() {
    return (
      <div className="pvtDropdown" style={{zIndex: this.props.zIndex}}>
        <div className="pvtLabel">Visualization Format</div>
        <div
          onClick={e => {
            e.stopPropagation();
            this.props.toggle();
          }}
          className={
            'pvtDropdownValue pvtDropdownCurrent ' +
            (this.props.open ? 'pvtDropdownCurrentOpen' : '')
          }
          role="button"
        >
          <div className={this.props.open ? "pvtDropdownIconOpen" : "pvtDropdownIcon"} >▾</div>
          {this.props.current || <span>&nbsp;</span>}
        </div>

        {this.props.open && (
          <div className="pvtDropdownMenu">
            {this.props.values.map(r => (
              <div
                key={r}
                role="button"
                onClick={e => {
                  e.stopPropagation();
                  if (this.props.current === r) {
                    this.props.toggle();
                  } else {
                    this.props.setValue(r);
                  }
                }}
                className={
                  'pvtDropdownValue2 ' +
                  (r === this.props.current ? 'pvtDropdownActiveValue' : '')
                }
              >
                {r}
              </div>
            ))}
          </div>
        )}
        <br/>
        <SearchFilterUI onSearchChange={s => {
          this.onSearchChange(s)
        }}/>
      </div>
    );
  }

  onSearchChange (s) {
    this.props.onSearchChange(s);
  }

}

class PivotTableUI extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      unusedOrder: [],
      zIndices: {},
      maxZIndex: 1000,
      openDropdown: false,
    };
  }

  componentWillMount() {
    this.materializeInput(this.props.data);
  }

  componentWillUpdate(nextProps) {
    this.materializeInput(nextProps.data);
  }

  materializeInput(nextData) {
    if (this.data === nextData) {
      return;
    }
    this.data = nextData;
    const attrValues = {};
    const materializedInput = [];
    let recordsProcessed = 0;
    PivotData.forEachRecord(this.data, this.props.derivedAttributes, function(
      record
    ) {
      materializedInput.push(record);
      for (const attr of Object.keys(record)) {
        if (!(attr in attrValues)) {
          attrValues[attr] = {};
          if (recordsProcessed > 0) {
            attrValues[attr].null = recordsProcessed;
          }
        }
      }
      for (const attr in attrValues) {
        const value = attr in record ? record[attr] : 'null';
        if (!(value in attrValues[attr])) {
          attrValues[attr][value] = 0;
        }
        attrValues[attr][value]++;
      }
      recordsProcessed++;
    });

    this.materializedInput = materializedInput;
    this.attrValues = attrValues;
  }

  sendPropUpdate(command) {
    this.props.onChange(update(this.props, command));
  }

  propUpdater(key) {
    return value => this.sendPropUpdate({[key]: {$set: value}});
  }

  setValuesInFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {
        [attribute]: {
          $set: values.reduce((r, v) => {
            r[v] = true;
            return r;
          }, {}),
        },
      },
    });
  }

  addValuesToFilter(attribute, values) {
    if (attribute in this.props.valueFilter) {
      this.sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce((r, v) => {
            r[v] = {$set: true};
            return r;
          }, {}),
        },
      });
    } else {
      this.setValuesInFilter(attribute, values);
    }
  }

  removeValuesFromFilter(attribute, values) {
      this.sendPropUpdate({
        valueFilter: {[attribute]: {$unset: values}},
      });

  }

  clearFilters(attribute) {
    this.sendPropUpdate({
      valueFilter: {[attribute]: {}},
    });
  }

  moveFilterBoxToTop(attribute) {
    this.setState(
      update(this.state, {
        maxZIndex: {$set: this.state.maxZIndex + 1},
        zIndices: {[attribute]: {$set: this.state.maxZIndex + 1}},
      })
    );
  }

  isOpen(dropdown) {
    return this.state.openDropdown === dropdown;
  }

  makeDnDCell(items, onChange, classes, categories = undefined) {

    const selectedList = this.props.cols.concat(this.props.rows)

    let collapsibles = [], draggables;
    if (categories) {
      for(let category in categories) {

        draggables = [];
        items.map(x => {
          if (categories[category].includes(x)) {
            draggables.push(<DraggableAttribute
              name={x}
              key={x}
              attrValues={this.attrValues[x]}
              valueFilter={this.props.valueFilter[x] || {}}
              sorter={getSort(this.props.sorters, x)}
              menuLimit={this.props.menuLimit}
              setValuesInFilter={this.setValuesInFilter.bind(this)}
              addValuesToFilter={this.addValuesToFilter.bind(this)}
              moveFilterBoxToTop={this.moveFilterBoxToTop.bind(this)}
              removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
              clearFilters={this.clearFilters.bind(this)}
              zIndex={this.state.zIndices[x] || this.state.maxZIndex}
              isSelected={selectedList.includes(x)}
              cols={this.props.cols}
              rows={this.props.rows}
              onUpdateProperties={ (s) => this.sendPropUpdate(s)}
            />);
          }
        });
        let open = category.toLowerCase() === 'demographics' ? true : false;
        collapsibles.push(
          <Collapsible
            trigger={category}
            open={open}
            //overflowWhenOpen="hidden" //Aji updated
            className="attrListClosed"
            openedClassName="attrListOpen"
            triggerClassName="attrHeaderClosed"
            triggerOpenedClassName="attrHeaderOpen"
          >
            <Sortable
              options={{
                group: 'shared',
                ghostClass: 'pvtPlaceholder',
                filter: '.pvtFilterBox',
                preventOnFilter: false,
              }}
              tag="div"
              onChange={onChange}
              className={classes}
            >
              {draggables}
            </Sortable>
          </Collapsible>);
      }
      return (
        <div className="pvtCollapsible">
          {collapsibles}
        </div>
      )
    } else {
      items.map(x => {
        collapsibles.push(
          <DraggableAttribute
            name={x}
            key={x}
            attrValues={this.attrValues[x]}
            valueFilter={this.props.valueFilter[x] || {}}
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={this.setValuesInFilter.bind(this)}
            addValuesToFilter={this.addValuesToFilter.bind(this)}
            moveFilterBoxToTop={this.moveFilterBoxToTop.bind(this)}
            removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
            clearFilters={this.clearFilters.bind(this)}
            zIndex={this.state.zIndices[x] || this.state.maxZIndex}
            isSelected={selectedList.includes(x)}
            cols={this.props.cols}
            rows={this.props.rows}
            onUpdateProperties={ (s) => this.sendPropUpdate(s)}
          />
        );
      });
      return (
        <Sortable
          options={{
            group: 'shared',
            ghostClass: 'pvtPlaceholder',
            filter: '.pvtFilterBox',
            preventOnFilter: false,
          }}
          tag="td"
          className={classes}
          onChange={onChange}
        >
          {collapsibles}
        </Sortable>
      )
    }
  }

  onSearchChange (s) {
    this.props.onSearchChange(s)
  }

  render() {
    const numValsAllowed =
      this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0;

    const rendererName =
      this.props.rendererName in this.props.renderers
        ? this.props.rendererName
        : Object.keys(this.props.renderers)[0];

    const rendererCell = (
      <td className="pvtRenderers">
        <Dropdown
          current={rendererName}
          values={Object.keys(this.props.renderers)}
          open={this.isOpen('renderer')}
          zIndex={this.isOpen('renderer') ? this.state.maxZIndex + 1 : 1}
          toggle={() =>
            this.setState({
              openDropdown: this.isOpen('renderer') ? false : 'renderer',
            })
          }
          setValue={this.propUpdater('rendererName')}
          onSearchChange={s => {
            this.onSearchChange(s)
          }}
        />
      </td>
    );

    const sortIcons = {
      key_a_to_z: {
        rowSymbol: '↕',
        colSymbol: '↔',
        next: 'value_a_to_z',
      },
      value_a_to_z: {
        rowSymbol: '↓',
        colSymbol: '→',
        next: 'value_z_to_a',
      },
      value_z_to_a: {rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z'},
    };

    const aggregatorCell = (
      <td className="pvtVals">
        <Tooltip content={HelpConstants.SORT_ROWS} eventOn='onClick' tagName='span'>
          <MaterialIcon icon="help_outline" className="pvtIconHelp"/>
        </Tooltip>
        <a
          role="button"
          className="pvtRowOrder"
          onClick={() =>
            this.propUpdater('rowOrder')(sortIcons[this.props.rowOrder].next)
          }
        >
         Sort rows {sortIcons[this.props.rowOrder].rowSymbol}
        </a>
        <br/>
        <Tooltip content={HelpConstants.SORT_COLUMNS} eventOn='onClick' tagName='span'>
          <MaterialIcon icon="help_outline" className="pvtIconHelp"/>
        </Tooltip>
        <a
          role="button"
          className="pvtColOrder"
          onClick={() =>
            this.propUpdater('colOrder')(sortIcons[this.props.colOrder].next)
          }
        >
         Sort columns {sortIcons[this.props.colOrder].colSymbol}
        </a>
        {numValsAllowed > 0 && <br />}
      </td>
    );

    const unusedAttrs = Object.keys(this.attrValues)
      .filter(
        e =>
          !this.props.rows.includes(e) &&
          !this.props.cols.includes(e) &&
          !this.props.hiddenAttributes.includes(e) &&
          !this.props.hiddenFromDragDrop.includes(e)
      )
      .sort(sortAs(this.state.unusedOrder));

    const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
    const horizUnused = unusedLength < this.props.unusedOrientationCutoff;
    const unusedAttrsCell = this.makeDnDCell(
      unusedAttrs,
      order => this.setState({unusedOrder: order}),
      `pvtAxisContainer pvtUnused ${
        horizUnused ? 'pvtHorizList' : 'pvtVertList collapsibleMenuContainer'
      }`,
      this.props.categoryToAttrMapping
    );

    const colAttrs = this.props.cols.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    );

    const colAttrsCell = this.makeDnDCell(
      colAttrs,
      this.propUpdater('cols'),
      'pvtAxisContainer pvtHorizList pvtCols'
    );

    const rowAttrs = this.props.rows.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    );
    const rowAttrsCell = this.makeDnDCell(
      rowAttrs,
      this.propUpdater('rows'),
      'pvtAxisContainer pvtVertList pvtRows'
    );
    const outputCell = (
      <td className="pvtOutput">
        <div className="pvt-output-title">{this.props.rendererName}</div>
        <PivotTable
          {...update(this.props, {
            data: {$set: this.materializedInput},
          })}
        />
      </td>
    );

    if (horizUnused) {
      return (
        <table className="pvtUi">
          <tbody onClick={() => this.setState({openDropdown: false})}>
            <tr>
              {rendererCell}
              {unusedAttrsCell}
            </tr>
            <tr>
              {aggregatorCell}
              {colAttrsCell}
            </tr>
            <tr>
              {rowAttrsCell}
              {outputCell}
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table className="pvtUi">
        <tbody onClick={() => this.setState({openDropdown: false})}>
          <tr>
            {rendererCell}
            {aggregatorCell}
            {colAttrsCell}
          </tr>
          <tr>
            {unusedAttrsCell}
            {rowAttrsCell}
            {outputCell}
          </tr>
        </tbody>
      </table>
    );
  }
}

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
  onChange: PropTypes.func.isRequired,
  hiddenAttributes: PropTypes.arrayOf(PropTypes.string),
  hiddenFromAggregators: PropTypes.arrayOf(PropTypes.string),
  hiddenFromDragDrop: PropTypes.arrayOf(PropTypes.string),
  unusedOrientationCutoff: PropTypes.number,
  menuLimit: PropTypes.number,
});

PivotTableUI.defaultProps = Object.assign({}, PivotTable.defaultProps, {
  hiddenAttributes: [],
  hiddenFromAggregators: [],
  hiddenFromDragDrop: [],
  unusedOrientationCutoff: 85,
  menuLimit: 500,
});

export default PivotTableUI;

