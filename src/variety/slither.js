//
// パズル固有スクリプト部 スリザーリンク・バッグ版 slither.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["slither"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["number", "clear", "info-line"],
			play: [
				"line",
				"peke",
				"bgcolor",
				"bgcolor1",
				"bgcolor2",
				"clear",
				"info-line"
			]
		},
		mouseinput_auto: function() {
			var puzzle = this.puzzle;
			if (puzzle.playmode) {
				if (this.checkInputBGcolor()) {
					this.inputBGcolor();
				} else if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						this.prevPos.reset();
						this.inputpeke();
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					}
				}
			} else if (puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
			}
		},

		checkInputBGcolor: function() {
			var inputbg = this.puzzle.execConfig("bgcolor");
			if (inputbg) {
				if (this.mousestart) {
					inputbg = this.getpos(0.25).oncell();
				} else if (this.mousemove) {
					inputbg = this.inputData >= 10;
				} else {
					inputbg = false;
				}
			}
			return inputbg;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: 4,
		minnum: 0,

		getdir4BorderLine1: function() {
			var adb = this.adjborder,
				cnt = 0;
			if (adb.top.isLine()) {
				cnt++;
			}
			if (adb.bottom.isLine()) {
				cnt++;
			}
			if (adb.left.isLine()) {
				cnt++;
			}
			if (adb.right.isLine()) {
				cnt++;
			}
			return cnt;
		}
	},

	Board: {
		hasborder: 2,
		borderAsLine: true,
		autoSolve: function (force) {
			if (!this.is_autosolve && !force) {
				var needUpdateField = false;
				for (var i = 0; i < this.border.length; ++i) {
					var b = this.border[i];
					if (b.lineBySolver !== 0 || b.qsubBySolver !== 0) {
						needUpdateField = true;
						b.lineBySolver = 0;
						b.qsubBySolver = 0;
					}
				}
				if (needUpdateField) this.puzzle.painter.paintAll();
				return;
			}
			// detect the problem
			var height = this.maxby / 2;
			var width = this.maxbx / 2;
			var problem = [];
			for (var y = 0; y < height; ++y) {
				var row = [];
				for (var x = 0; x < width; ++x) {
					row.push(-1);
				}
				problem.push(row);
			}
			var s = 0;
			for (var i = 0; i < this.cell.length; ++i) {
				if (this.cell[i].qnum >= 0) {
					problem[(this.cell[i].by - 1) / 2][(this.cell[i].bx - 1) / 2] = this.cell[i].qnum;
					s += this.cell[i].qnum;
				}
			}

			var answer = Cspuz.puzzle.solveSlitherlink(height, width, problem);
			if (answer !== null) {
				for (var i = 0; i < this.border.length; ++i) {
					var b = this.border[i];
					var value;
					if (b.by % 2 === 0) {
						value = answer.horizontal[b.by / 2][(b.bx - 1) / 2];
					} else {
						value = answer.vertical[(b.by - 1) / 2][b.bx / 2];
					}
					if (value === 0) {
						b.lineBySolver = 0;
						b.qsubBySolver = 0;
					} else if (value === 1) {
						b.lineBySolver = 1;
						b.qsubBySolver = 0;
					} else if (value === 2) {
						b.lineBySolver = 0;
						b.qsubBySolver = 2;
					}
				}
			}
			this.puzzle.painter.paintAll();
		}
	},

	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,
		bgcellcolor_func: "qsub2",
		numbercolor_func: "qnum",
		margin: 0.5,

		paint: function() {
			this.drawBGCells();
			this.drawLines();
			this.drawBaseMarks();
			this.drawQuesNumbers();
			this.drawPekes();
			this.drawTarget();
		},

		repaintParts: function(blist) {
			this.range.crosses = blist.crossinside();
			this.drawBaseMarks();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decode4Cell();
		},
		encodePzpr: function(type) {
			this.encode4Cell();
		},

		decodeKanpen: function() {
			this.fio.decodeCellQnum_kanpen();
		},
		encodeKanpen: function() {
			this.fio.encodeCellQnum_kanpen();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			if (this.filever === 1) {
				this.decodeCellQnum();
				this.decodeCellQsub();
				this.decodeBorderLine();
			} else if (this.filever === 0) {
				this.decodeCellQnum();
				this.decodeBorderLine();
			}
		},
		encodeData: function() {
			this.filever = 1;
			this.encodeCellQnum();
			this.encodeCellQsub();
			this.encodeBorderLine();
		},
		kanpenOpen: function() {
			this.decodeCellQnum_kanpen();
			this.decodeBorderLine();
		},
		kanpenSave: function() {
			this.encodeCellQnum_kanpen();
			this.encodeBorderLine();
		},

		kanpenOpenXML: function() {
			this.PBOX_ADJUST = 0;
			this.decodeCellQnum_XMLBoard_Brow();
			this.PBOX_ADJUST = 1;
			this.decodeBorderLine_slither_XMLAnswer();
		},
		kanpenSaveXML: function() {
			this.PBOX_ADJUST = 0;
			this.encodeCellQnum_XMLBoard_Brow();
			this.PBOX_ADJUST = 1;
			this.encodeBorderLine_slither_XMLAnswer();
		},

		UNDECIDED_NUM_XML: 5,
		PBOX_ADJUST: 1,
		decodeBorderLine_slither_XMLAnswer: function() {
			this.decodeCellXMLArow(function(cross, name) {
				var val = 0;
				var bdh = cross.relbd(0, 1),
					bdv = cross.relbd(1, 0);
				if (name.charAt(0) === "n") {
					val = +name.substr(1);
				} else {
					if (name.match(/h/)) {
						val += 1;
					}
					if (name.match(/v/)) {
						val += 2;
					}
				}
				if (val & 1) {
					bdh.line = 1;
				}
				if (val & 2) {
					bdv.line = 1;
				}
				if (val & 4) {
					bdh.qsub = 2;
				}
				if (val & 8) {
					bdv.qsub = 2;
				}
			});
		},
		encodeBorderLine_slither_XMLAnswer: function() {
			this.encodeCellXMLArow(function(cross) {
				var val = 0,
					nodename = "";
				var bdh = cross.relbd(0, 1),
					bdv = cross.relbd(1, 0);
				if (bdh.line === 1) {
					val += 1;
				}
				if (bdv.line === 1) {
					val += 2;
				}
				if (bdh.qsub === 2) {
					val += 4;
				}
				if (bdv.qsub === 2) {
					val += 8;
				}

				if (val === 0) {
					nodename = "s";
				} else if (val === 1) {
					nodename = "h";
				} else if (val === 2) {
					nodename = "v";
				} else if (val === 3) {
					nodename = "hv";
				} else {
					nodename = "n" + val;
				}
				return nodename;
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",

			"checkdir4BorderLine",

			"checkOneLoop",
			"checkDeadendLine+"
		],

		checkdir4BorderLine: function() {
			this.checkAllCell(function(cell) {
				return cell.qnum >= 0 && cell.getdir4BorderLine1() !== cell.qnum;
			}, "nmLineNe");
		}
	},

	FailCode: {
		nmLineNe: [
			"数字の周りにある線の本数が違います。",
			"The number is not equal to the number of lines around it."
		]
	}
});
