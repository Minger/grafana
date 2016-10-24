///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import config from 'app/core/config';
import {coreModule, appEvents} from 'app/core/core';

export class DashRowCtrl {
  dashboard: any;
  row: any;
  panelPlugins;

   /** @ngInject */
  constructor(private $scope, private $rootScope) {
    this.panelPlugins = config.panels;
  }

  onDrop(panelId, dropTarget) {
    var info = this.dashboard.getPanelInfoById(panelId);
    if (dropTarget) {
      var dropInfo = this.dashboard.getPanelInfoById(dropTarget.id);
      dropInfo.row.panels[dropInfo.index] = info.panel;
      info.row.panels[info.index] = dropTarget;
      var dragSpan = info.panel.span;
      info.panel.span = dropTarget.span;
      dropTarget.span = dragSpan;
    } else {
      info.row.panels.splice(info.index, 1);
      info.panel.span = 12 - this.dashboard.rowSpan(this.row);
      this.row.panels.push(info.panel);
    }

    this.$rootScope.$broadcast('render');
  }

  addPanel(panel) {
    this.dashboard.addPanel(panel, this.row);
  }

  editRow() {
    // this.appEvent('show-dash-editor', {
    //   src: 'public/app/partials/roweditor.html',
    //   scope: this.$scope.$new()
    // });
  }

  addPanelDefault(type) {
    var defaultSpan = 12;
    var _as = 12 - this.dashboard.rowSpan(this.row);

    var panel = {
      title: config.new_panel_title,
      error: false,
      span: _as < defaultSpan && _as > 0 ? _as : defaultSpan,
      editable: true,
      type: type,
      isNew: true,
    };

    this.addPanel(panel);
  }

  deleteRow() {
    if (!this.row.panels.length) {
      this.dashboard.rows = _.without(this.dashboard.rows, this.row);
      return;
    }

    appEvents.emit('confirm-modal', {
      title: 'Delete',
      text: 'Are you sure you want to delete this row?',
      icon: 'fa-trash',
      yesText: 'Delete',
      onConfirm: () => {
        this.dashboard.rows = _.without(this.dashboard.rows, this.row);
      }
    });
  }
}

export function rowDirective($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/row/row.html',
    controller: DashRowCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: "=",
      row: "=",
    },
    link: function(scope, element) {
      scope.$watchGroup(['ctrl.row.collapse', 'ctrl.row.height'], function() {
        element.css({minHeight: scope.ctrl.row.collapse ? '5px' : scope.ctrl.row.height});
      });

      $rootScope.onAppEvent('panel-fullscreen-enter', function(evt, info) {
        var hasPanel = _.find(scope.ctrl.row.panels, {id: info.panelId});
        if (!hasPanel) {
          element.hide();
        }
      }, scope);

      $rootScope.onAppEvent('panel-fullscreen-exit', function() {
        element.show();
      }, scope);
    }
  };
}

coreModule.directive('dashRow', rowDirective);


coreModule.directive('panelWidth', function($rootScope) {

  return function(scope, element) {
    var fullscreen = false;

    function updateWidth() {
      if (!fullscreen) {
        element[0].style.width = ((scope.panel.span / 1.2) * 10) + '%';
      }
    }

    $rootScope.onAppEvent('panel-fullscreen-enter', function(evt, info) {
      fullscreen = true;

      if (scope.panel.id !== info.panelId) {
        element.hide();
      } else {
        element[0].style.width = '100%';
      }
    }, scope);

    $rootScope.onAppEvent('panel-fullscreen-exit', function(evt, info) {
      fullscreen = false;

      if (scope.panel.id !== info.panelId) {
        element.show();
      }

      updateWidth();
    }, scope);

    scope.$watch('panel.span', updateWidth);

    if (fullscreen) {
      element.hide();
    }
  };
});


coreModule.directive('panelDropZone', function($timeout) {
  return function(scope, element) {
    scope.$on("ANGULAR_DRAG_START", function() {
      $timeout(function() {
        var dropZoneSpan = 12 - scope.ctrl.dashboard.rowSpan(scope.ctrl.row);

        if (dropZoneSpan > 0) {
          element.find('.panel-container').css('height', scope.ctrl.row.height);
          element[0].style.width = ((dropZoneSpan / 1.2) * 10) + '%';
          element.show();
        }
      });
    });

    scope.$on("ANGULAR_DRAG_END", function() {
      element.hide();
    });
  };
});
