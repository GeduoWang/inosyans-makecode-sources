namespace inosyan_core_utils {
    import Size2 = inosyan_core_math.Size2
    import Size3 = inosyan_core_math.Size3
    import Vector3 = inosyan_core_math.Vector3

    /**
     * Convert something value to another type. / ある値を別の型に変換します。
     */
    export class Converter {
        /**
         * Convert CompassDirection to FourDirection. / CompassDirection を FourDirection に変換します。
         * @param direction CompassDirection
         */
        static convertFourDirectionFromCompass(direction: CompassDirection): FourDirection {
            switch (direction) {
                case CompassDirection.North: return FourDirection.Forward;
                case CompassDirection.East: return FourDirection.Right;
                case CompassDirection.South: return FourDirection.Back;
                case CompassDirection.West: return FourDirection.Left;
            }
            return FourDirection.Forward;
        }
    }

    /**
     * Manipulate agent. / エージェントを操作します。
     */
    export class AgentProxy {
        /**
         * Teleport agent to the specified position. / エージェントを指定した座標にテレポートさせます。
         * @param position Position to teleport / テレポートさせる位置
         */
        static teleport(position: Vector3): void {
            const orgPos = PlayerProxy.position();
            PlayerProxy.teleport(position);
            agent.teleportToPlayer();
            PlayerProxy.teleport(orgPos);
        }

        /**
         * Teleport agent to the specified position and change direction. / エージェントを指定した座標にテレポートさせ、向きを変えます。
         * @param position Position to teleport / テレポートさせる位置
         * @param turnDirection Direction of agent / エージェントの向き
         */
        static teleportAndTurn(position: Vector3, turnDirection: FourDirection): void {
            AgentProxy.teleport(position);

            const left = Block.Grass;
            const right = Block.Stone;
            const back = Block.Dirt;
            const forward = Block.Cobblestone;
            BlocksProxy.place(left, position.clone().add(new Vector3(-1, 0, 0).rotate(turnDirection)));
            BlocksProxy.place(right, position.clone().add(new Vector3(1, 0, 0).rotate(turnDirection)));
            BlocksProxy.place(back, position.clone().add(new Vector3(0, 0, 1).rotate(turnDirection)));
            BlocksProxy.place(forward, position.clone().add(new Vector3(0, 0, -1).rotate(turnDirection)));

            const inspectedBlock = agent.inspect(AgentInspection.Block, SixDirection.Forward);
            let direction: TurnDirection = inspectedBlock === left ? TurnDirection.Right : TurnDirection.Left;
            let turnCount = inspectedBlock === back ? 2 : inspectedBlock === forward ? 0 : 1;

            for (let i = 0; i < turnCount; i++) {
                agent.turn(direction);
            }
            BlocksProxy.place(Block.Air, position.clone().addValue(-1, 0, 0));
            BlocksProxy.place(Block.Air, position.clone().addValue(1, 0, 0));
            BlocksProxy.place(Block.Air, position.clone().addValue(0, 0, 1));
            BlocksProxy.place(Block.Air, position.clone().addValue(0, 0, -1));
        }
    }

    /**
     * Manipulate blocks. / ブロックを操作します。
     */
    export class BlocksProxy {
        /**
         * Fill in the specified range with block. / 指定した範囲をブロックで埋めます。
         * @param blockId Block's ID / ブロックのID
         * @param fromPos Start position of the range / 範囲の開始位置
         * @param toPos End position of the range / 範囲の終了位置
         * @param fillOperation Fill options for exixting blocks. / 既存のブロックの取扱方法
         */
        static fill(blockId: number, fromPos: Vector3, toPos: Vector3,
            fillOperation: FillOperation = FillOperation.Replace): void {
            blocks.fill(blockId, fromPos.toPosition(), toPos.toPosition(), fillOperation);
        }

        /**
         * Place a block to the specified position. / 指定した位置にブロックを置きます。
         * @param blockId Block's ID / ブロックのID
         * @param pos Position / 位置
         */
        static place(blockId: number, pos: Vector3): void {
            blocks.place(blockId, pos.toPosition());
        }

        /**
         * Clone the blocks in the specified range. / 指定した範囲にあるブロックを複製します。
         * @param begin Start position of the range / 範囲の開始位置
         * @param end End position of the range / 範囲の終了位置
         * @param destination Destination position / 複製先の位置
         * @param mask Replace|Masked / 置き換え|マスク
         * @param mode Normal|Move|Force / 通常|移動|強制
         */
        static clone(begin: Vector3, end: Vector3, destination: Vector3,
            mask: CloneMask = CloneMask.Replace, mode: CloneMode = CloneMode.Normal): void {
            blocks.clone(begin.toPosition(), end.toPosition(), destination.toPosition(), mask, mode);
        }

        /**
         * Replace the blocks in the specified range with the new block. / 指定した範囲にあるブロックを新しいブロックに置き換えます。
         * @param newblock New block ID / 新しいブロックID
         * @param oldblock Old block ID / 古いブロックID
         * @param from Start position of the range / 範囲の開始位置
         * @param to End position of the range / 範囲の終了位置
         */
        static replace(newblock: number, oldblock: number, from: Vector3, to: Vector3): void {
            blocks.replace(newblock, oldblock, from.toPosition(), to.toPosition());
        }
    }

    /**
     * Enhanced commands for block manipulation. / ブロック操作に関する便利コマンド
     */
    export class BuildUtil {
        /**
         * Clear blocks in the specified range. / 指定した範囲のブロックを消します。
         * @param size Range to clear / クリアする範囲
         * @param startPos Start position / 開始位置
         */
        static clear(size: Size3, startPos: Vector3): void {
            BuildUtil.fill(Block.Air, size, startPos);
        }

        /**
         * Fill in the specified range with block. / 指定した範囲をブロックで埋めます。
         * @param blockId Block ID / ブロックID
         * @param size Range to fill / 埋める範囲
         * @param startPos Start position / 開始位置
         * @param fillOperation Fill options for exixting blocks. / 既存のブロックの取扱方法
         */
        static fill(blockId: number, size: Size3, startPos: Vector3, fillOperation: FillOperation = FillOperation.Replace): void {
            BuildUtil.spaceOperation(size, startPos, (size, pos) => {
                BlocksProxy.fill(blockId, pos, pos.clone().addSize(size), fillOperation);
            });
        }

        /**
         * Clone the blocks in the specified range. / 指定した範囲にあるブロックを複製します。
         * @param begin Start position of the range / 範囲の開始位置
         * @param size Range to clone / 複製する範囲
         * @param destination Destination position / 複製先の位置
         * @param mask Replace|Masked / 置き換え|マスク
         * @param mode Normal|Move|Force / 通常|移動|強制
         */
        static clone(begin: Vector3, size: Size3, destination: Vector3,
            mask: CloneMask = CloneMask.Replace, mode: CloneMode = CloneMode.Normal): void {
            const dif = destination.clone().subtract(begin);
            BuildUtil.spaceOperation(size, begin, (size, pos) => {
                const end = pos.clone().addSize(size);
                const dest = pos.clone().add(dif);
                BlocksProxy.clone(pos, end, dest, mask, mode);
            });
        }

        /**
         * Replace the blocks in the specified range with the new block. / 指定した範囲にあるブロックを新しいブロックに置き換えます。
         * @param newblock New block ID / 新しいブロックID
         * @param oldblock Old block ID / 古いブロックID
         * @param size Range to replace / 置き換える範囲
         * @param startPos Start position / 開始位置
         */
        static replace(newblock: number, oldblock: number, size: Size3, startPos: Vector3): void {
            BuildUtil.spaceOperation(size, startPos, (size, pos) => {
                BlocksProxy.replace(newblock, oldblock, pos, pos.clone().addSize(size));
            });
        }

        /**
         * Create frame in the specified range. / 指定した範囲に枠を作ります。
         * @param blockId Block ID / ブロックID
         * @param size Range to create frame / フレームを作る範囲
         * @param startPos Start position / 開始位置
         * @param thickness Thickness of frame / フレームの厚み
         */
        static frame(blockId: number, size: Size3, startPos: Vector3,
            thickness: number = 1): void {
            const makeLine = (localSize: Size3, localPos: Vector3) => {
                BuildUtil.spaceOperation(localSize, localPos, (size, pos) => {
                    BlocksProxy.fill(blockId, pos, pos.clone().addSize(size));
                });
            }
            const marginX = size.width - thickness;
            const marginY = size.height - thickness;
            const marginZ = size.depth - thickness;
            const sizeX = new Size3(size.width, thickness, thickness);
            const sizeY = new Size3(thickness, size.height, thickness);
            const sizeZ = new Size3(thickness, thickness, size.depth);
            // Frame X
            if (size.width > thickness) {
                makeLine(sizeX, startPos);
                makeLine(sizeX, startPos.clone().addValue(0, 0, marginZ));
                makeLine(sizeX, startPos.clone().addValue(0, marginY, 0));
                makeLine(sizeX, startPos.clone().addValue(0, marginY, marginZ));
            }
            // Frame Y
            if (size.height > thickness) {
                makeLine(sizeY, startPos);
                makeLine(sizeY, startPos.clone().addValue(0, 0, marginZ));
                makeLine(sizeY, startPos.clone().addValue(marginX, 0, 0));
                makeLine(sizeY, startPos.clone().addValue(marginX, 0, marginZ));
            }
            // Frame Z
            if (size.depth > thickness) {
                makeLine(sizeZ, startPos);
                makeLine(sizeZ, startPos.clone().addValue(marginX, 0, 0));
                makeLine(sizeZ, startPos.clone().addValue(0, marginY, 0));
                makeLine(sizeZ, startPos.clone().addValue(marginX, marginY, 0));
            }
        }

        /**
         * Draw a pattern by placing blocks in a plate form. / 板状にブロックをならべてパターンを描きます。
         * @param startPos Start position / 開始位置
         * @param direction Direction of plate / 板の向き
         * @param size Range to create frame / フレームを作る範囲
         * @param patternBlock Blocks for pattern / パターンに使うブロック
         * @param patternData Pattern data / パターンデータ
         * @param ignoreBlocks Block ID not to be placed.  配置を行わないブロックID
         */
        static drawPlane(startPos: Vector3, direction: SixDirection, size: Size2,
            patternBlock: number[], patternData: number[][], ignoreBlocks: number[]): void {

            class CloneCoreLoopParam {
                public incrementByWidth: (pos: Vector3) => boolean;
                public incrementByHeight: (pos: Vector3) => boolean;
                public cloneWidth: (param: CloneWidthHeightParam) => void;
                public cloneHeight: (param: CloneWidthHeightParam) => void;

                constructor(incrementByWidth: (pos: Vector3) => boolean,
                    incrementByHeight: (pos: Vector3) => boolean,
                    cloneWidth: (param: CloneWidthHeightParam) => void,
                    cloneHeight: (param: CloneWidthHeightParam) => void) {
                    this.incrementByWidth = incrementByWidth;
                    this.incrementByHeight = incrementByHeight;
                    this.cloneWidth = cloneWidth;
                    this.cloneHeight = cloneHeight;
                }
            }

            class CloneWidthHeightParam {
                public patternW: number;
                public patternH: number;
                public cloneLength: number;
                public addedLength: number;

                constructor(patternW: number, patternH: number, cloneLength: number, addedLength: number) {
                    this.patternW = patternW;
                    this.patternH = patternH;
                    this.cloneLength = cloneLength;
                    this.addedLength = addedLength;
                }
            }

            const coreLoop = (param: CloneCoreLoopParam) => {
                const pos = startPos.clone();
                loopA:
                for (let i = 0; i < patternData.length; i++) {
                    const line = patternData[i];
                    loopB:
                    for (let j = 0; j < line.length; j++) {
                        const b = line[j];
                        const blockId = patternBlock[b];
                        if (ignoreBlocks.indexOf(blockId) === -1) {
                            BlocksProxy.place(blockId, pos);
                        }
                        if (param.incrementByWidth(pos)) {
                            break loopB;
                        }
                    }
                    if (param.incrementByHeight(pos)) {
                        break loopA;
                    }
                }
                const patternH = patternData.length < size.height ? patternData.length : size.height;
                const patternW = patternData[0].length < size.width ? patternData[0].length : size.width;

                let restWidth = size.width - patternW;
                while (0 < restWidth) {
                    const cloneW = restWidth > patternW ? patternW : restWidth;
                    const addedW = size.width - patternW - restWidth;
                    param.cloneWidth(new CloneWidthHeightParam(patternW, patternH, cloneW, addedW));
                    restWidth -= cloneW;
                }
                let restHeight = size.height - patternH;
                while (0 < restHeight) {
                    const cloneH = restHeight > patternH ? patternH : restHeight;
                    const addedH = size.height - patternH - restHeight;
                    param.cloneHeight(new CloneWidthHeightParam(patternW, patternH, cloneH, addedH));
                    restHeight -= cloneH;
                }

            }
            const incrementX = (delta: number = 1) => {
                return (pos: Vector3): boolean => {
                    pos.x += delta;
                    return Math.abs(pos.x - startPos.x) >= size.width;
                };
            };
            const incrementZ = (delta: number = 1) => {
                return (pos: Vector3): boolean => {
                    pos.z += delta;
                    return Math.abs(pos.z - startPos.z) >= size.width;
                };
            };
            const resetXAndIncrementY = (pos: Vector3): boolean => {
                pos.x = startPos.x;
                pos.y -= 1;
                return startPos.y - pos.y >= size.height;
            };
            const resetZAndIncrementY = (pos: Vector3): boolean => {
                pos.z = startPos.z;
                pos.y -= 1;
                return startPos.y - pos.y >= size.height;
            };
            const resetXAndIncrementZ = (pos: Vector3): boolean => {
                pos.x = startPos.x;
                pos.z += 1;
                return Math.abs(pos.z - startPos.z) >= size.height;
            };
            const cloneWidthForX = (sign: number = 1) => {
                return (param: CloneWidthHeightParam): void => {
                    const adjustX = sign > 0 ? 0 : - (param.cloneLength - 1);
                    BlocksProxy.clone(startPos, startPos.clone().addValue(sign * (param.cloneLength - 1), - (param.patternH - 1), 0),
                        startPos.clone().addValue(sign * (param.patternW + param.addedLength) + adjustX, - (param.patternH - 1), 0));
                };
            };
            const cloneWidthForY = (sign: number = 1) => {
                return (param: CloneWidthHeightParam): void => {
                    const adjustX = sign > 0 ? 0 : - (param.cloneLength - 1);
                    BlocksProxy.clone(startPos, startPos.clone().addValue(sign * (param.cloneLength - 1), 0, param.patternH - 1),
                        startPos.clone().addValue(sign * (param.patternW + param.addedLength) + adjustX, 0, 0));
                };
            };
            const cloneWidthForZ = (sign: number = 1) => {
                return (param: CloneWidthHeightParam): void => {
                    const adjustZ = sign > 0 ? 0 : - (param.cloneLength - 1);
                    BlocksProxy.clone(startPos, startPos.clone().addValue(0, - (param.patternH - 1), sign * (param.cloneLength - 1)),
                        startPos.clone().addValue(0, - (param.patternH - 1), sign * (param.patternW + param.addedLength) + adjustZ));
                };
            };
            const cloneHeightForX = (sign: number = 1) => {
                const destX = sign > 0 ? 0 : - (size.width - 1);
                return (param: CloneWidthHeightParam): void => {
                    BlocksProxy.clone(startPos, startPos.clone().addValue(sign * (size.width - 1), - (param.cloneLength - 1), 0),
                        startPos.clone().addValue(destX, -(param.patternH + param.addedLength + param.cloneLength - 1), 0));
                };
            };
            const cloneHeightForY = (sign: number = 1) => {
                const destX = sign > 0 ? 0 : - (size.width - 1);
                return (param: CloneWidthHeightParam): void => {
                    BlocksProxy.clone(startPos, startPos.clone().addValue(sign * (size.width - 1), 0, param.cloneLength - 1),
                        startPos.clone().addValue(destX, 0, param.patternH + param.addedLength));
                };
            };
            const cloneHeightForZ = (sign: number = 1) => {
                const destZ = sign > 0 ? 0 : - (size.width - 1);
                return (param: CloneWidthHeightParam): void => {
                    BlocksProxy.clone(startPos, startPos.clone().addValue(0, - (param.cloneLength - 1), sign * (size.width - 1)),
                        startPos.clone().addValue(0, -(param.patternH + param.addedLength + param.cloneLength - 1), destZ));
                };
            };

            switch (direction) {
                case SixDirection.Forward:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementX(1),
                            resetXAndIncrementY,
                            cloneWidthForX(1),
                            cloneHeightForX(1)
                        )
                    );
                    break;
                case SixDirection.Back:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementX(-1),
                            resetXAndIncrementY,
                            cloneWidthForX(-1),
                            cloneHeightForX(-1)
                        )
                    );
                    break;
                case SixDirection.Left:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementZ(1),
                            resetZAndIncrementY,
                            cloneWidthForZ(1),
                            cloneHeightForZ(1)
                        )
                    );
                    break;
                case SixDirection.Right:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementZ(-1),
                            resetZAndIncrementY,
                            cloneWidthForZ(-1),
                            cloneHeightForZ(-1)
                        )
                    );
                    break;
                case SixDirection.Up:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementX(1),
                            resetXAndIncrementZ,
                            cloneWidthForY(1),
                            cloneHeightForY(1)
                        )
                    );
                    break;
                case SixDirection.Down:
                    coreLoop(
                        new CloneCoreLoopParam(
                            incrementX(-1),
                            resetXAndIncrementZ,
                            cloneWidthForY(-1),
                            cloneHeightForY(-1)
                        )
                    );
                    break;
            }
        }

        private static spaceOperation(size: Size3, startPos: Vector3,
            callBack: (size: Size3, pos: Vector3) => void): void {
            const MAX_LENGTH: number = 20;
            let restW = size.width;
            const pos = startPos.clone();
            while (restW > 0) {
                const w = restW < MAX_LENGTH ? restW : MAX_LENGTH;
                restW -= w;
                let restH = size.height;
                while (restH > 0) {
                    const h = restH < MAX_LENGTH ? restH : MAX_LENGTH;
                    restH -= h;
                    let restD = size.depth;
                    while (restD > 0) {
                        const d = restD < MAX_LENGTH ? restD : MAX_LENGTH;
                        restD -= d;
                        callBack(new Size3(w, h, d), pos);
                        pos.z += d;
                    }
                    pos.y += h;
                    pos.z = startPos.z;
                }
                pos.x += w;
                pos.y = startPos.y;
            }
        }
    }

    /**
     * Manipulate player. / プレイヤーを操作します。
     */
    export class PlayerProxy {
        /**
         * Get the player's position. / プレイヤーの位置を取得します。
         */
        static position(): Vector3 {
            const pos = new Vector3();
            pos.setPosition(player.position().toWorld(), true);
            return pos;
        }

        /**
         * Tepeport player to the specified position. / プレイヤーを指定した位置にテレポートします。
         * @param pos Position / 位置
         */
        static teleport(pos: Vector3): void {
            player.teleport(pos.toPosition());
        }

        /**
         * Get the player's direction. / プレイヤーの向きを取得します。
         */
        static getDirection(): CompassDirection {
            const centerPos = PlayerProxy.position().clone().addValue(0, 0, 0);
            const dirs = [CompassDirection.North, CompassDirection.South, CompassDirection.East, CompassDirection.West];
            for (let i = 0; i < dirs.length; i++) {
                const d = dirs[i];
                let p: Vector3 = new Vector3();
                switch (d) {
                    case CompassDirection.North: p = centerPos.clone().addValue(0, 0, -1); break;
                    case CompassDirection.South: p = centerPos.clone().addValue(0, 0, 1); break;
                    case CompassDirection.East: p = centerPos.clone().addValue(1, 0, 0); break;
                    case CompassDirection.West: p = centerPos.clone().addValue(-1, 0, 0); break;
                }
                if (blocks.testForBlock(Block.Torch, p.toPosition())) return d;
            };
            return CompassDirection.North;
        }
    }
}
