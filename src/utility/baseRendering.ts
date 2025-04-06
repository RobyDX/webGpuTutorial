export abstract class baseRendering {
    public frameId: number = 0;
    abstract init(): Promise<void>;
    abstract draw(): void;
    abstract destroy(): void;
}