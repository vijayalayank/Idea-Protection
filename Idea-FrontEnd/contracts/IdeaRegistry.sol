// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract IdeaRegistry {
    struct Idea {
        uint256 id;
        address owner;
        string metadataHash; // IPFS hash containing ALL idea data (title, description, files, etc.)
        uint256 timestamp;
        bool isPrivate;
        string accessHash; // IPFS hash for private access data (encrypted)
        bool exists;
    }
    
    struct PublicIdea {
        uint256 id;
        address owner;
        string metadataHash;
        uint256 timestamp;
    }

    mapping(uint256 => Idea) private ideas;
    mapping(address => uint256[]) private userIdeas;
    mapping(string => bool) private hashExists;
    
    uint256 private nextIdeaId = 1;
    uint256 public totalIdeas = 0;
    
    event IdeaRegistered(
        uint256 indexed ideaId,
        address indexed owner,
        string metadataHash,
        uint256 timestamp,
        bool isPrivate
    );

    event IdeaAccessed(
        uint256 indexed ideaId,
        address indexed accessor,
        uint256 timestamp
    );

    modifier onlyIdeaOwner(uint256 _ideaId) {
        require(ideas[_ideaId].exists, "Idea does not exist");
        require(ideas[_ideaId].owner == msg.sender, "Not the idea owner");
        _;
    }

    modifier ideaExists(uint256 _ideaId) {
        require(ideas[_ideaId].exists, "Idea does not exist");
        _;
    }

    function registerIdea(
        string memory _metadataHash,
        bool _isPrivate,
        string memory _accessHash
    ) external returns (uint256) {
        require(bytes(_metadataHash).length > 0, "Metadata hash cannot be empty");
        require(!hashExists[_metadataHash], "Idea with this content already exists");

        uint256 ideaId = nextIdeaId++;

        ideas[ideaId] = Idea({
            id: ideaId,
            owner: msg.sender,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            isPrivate: _isPrivate,
            accessHash: _accessHash,
            exists: true
        });

        userIdeas[msg.sender].push(ideaId);
        hashExists[_metadataHash] = true;
        totalIdeas++;

        emit IdeaRegistered(ideaId, msg.sender, _metadataHash, block.timestamp, _isPrivate);

        return ideaId;
    }
    
    function getPublicIdeas(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (PublicIdea[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        uint256 publicCount = 0;
        
        // Count public ideas
        for (uint256 i = 1; i < nextIdeaId; i++) {
            if (ideas[i].exists && !ideas[i].isPrivate) {
                publicCount++;
            }
        }
        
        if (_offset >= publicCount) {
            return new PublicIdea[](0);
        }
        
        uint256 resultLength = publicCount - _offset;
        if (resultLength > _limit) {
            resultLength = _limit;
        }
        
        PublicIdea[] memory result = new PublicIdea[](resultLength);
        uint256 currentIndex = 0;
        uint256 skipped = 0;
        
        for (uint256 i = 1; i < nextIdeaId && currentIndex < resultLength; i++) {
            if (ideas[i].exists && !ideas[i].isPrivate) {
                if (skipped >= _offset) {
                    result[currentIndex] = PublicIdea({
                        id: ideas[i].id,
                        owner: ideas[i].owner,
                        metadataHash: ideas[i].metadataHash,
                        timestamp: ideas[i].timestamp
                    });
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }
        
        return result;
    }
    
    function getMyIdeas() external view returns (uint256[] memory) {
        return userIdeas[msg.sender];
    }
    
    function getIdeaDetails(uint256 _ideaId)
        external
        view
        ideaExists(_ideaId)
        returns (Idea memory) {
        Idea memory idea = ideas[_ideaId];

        // For private ideas, only return basic info
        // Access control is handled off-chain via IPFS encryption
        if (idea.isPrivate && idea.owner != msg.sender) {
            // Return limited info for private ideas
            return Idea({
                id: idea.id,
                owner: idea.owner,
                metadataHash: "", // Hide metadata hash for private ideas
                timestamp: idea.timestamp,
                isPrivate: true,
                accessHash: idea.accessHash, // This contains encrypted access info
                exists: true
            });
        }

        return idea;
    }
    
    function verifyIdeaOwnership(uint256 _ideaId, address _owner) 
        external 
        view 
        ideaExists(_ideaId)
        returns (bool) {
        return ideas[_ideaId].owner == _owner;
    }
    
    function getTotalPublicIdeas() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextIdeaId; i++) {
            if (ideas[i].exists && !ideas[i].isPrivate) {
                count++;
            }
        }
        return count;
    }
}
