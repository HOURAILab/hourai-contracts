
interface IHOURAI {

    function mint(
        uint256 quantity
    ) external payable;

}
contract HOURAICaller {
    address public hourAi;
    constructor(address _hourAi) {
        hourAi = _hourAi;
    }
    function mint(uint256 quantity) external payable {
        IHOURAI(hourAi).mint(quantity);
    }
}