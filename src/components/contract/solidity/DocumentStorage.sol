// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract DocumentStorage is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("ISSUER_ROLE");
    uint256 private _nextTokenId;

    struct DocumentMetadata {
        address issuer;
        address receiver;
        string certName;
        string urlPdf;
    }

    // event DocMinted(uint256 tokenId, address issuer, address receiver);

    constructor(address[] memory _admins, address[] memory _minter)
        ERC721("DocumentStorage", "DSG")
    {
        _nextTokenId = 0;
        for (uint256 i = 0; i < _admins.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
        }
        for (uint256 i = 0; i < _minter.length; i++) {
            _grantRole(MINTER_ROLE, _minter[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function safeMintDocument(
        address _receiver,
        string memory _uri
    ) public onlyRole(DEFAULT_ADMIN_ROLE) onlyRole(MINTER_ROLE) returns (uint256 issuedTokenId) {
        uint256 newTokenId = _nextTokenId++;
        _safeMint(_receiver, newTokenId);
        _setTokenURI(newTokenId, _uri);
        return newTokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function addIssuer(address newIssuer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, newIssuer);
    }

    function removeIssuer(address issuer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, issuer);
    }
}
