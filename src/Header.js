import React from 'react';
import { Box, Flex, Image, useColorMode } from '@chakra-ui/react';

const Header = ({ logoSrc }) => {
  const { colorMode } = useColorMode();

  return (
    <Box as="header" bg={colorMode === 'light' ? "#8C52FF" : "gray.800"} p={4} color="white" position="sticky" top="0" zIndex="1">
      <Flex alignItems="center" justifyContent="space-between" wrap="wrap" mx="5%">

        {/* Left Container for Navigation and Empty Space */}
        <Flex alignItems="center" width={["auto", "auto", "20%"]}>
          {/* Navigation Links */}
          {/* <Text ml={3} cursor="pointer">About</Text>
          <Text ml={3} cursor="pointer">FAQ</Text>
          <Text ml={3} cursor="pointer">Contact</Text> */}
        </Flex>

        {/* Logo - to ensure it is centered */}
        <Flex justifyContent="center" alignItems="center" flex="1">
          <Image src={logoSrc} alt="App Logo" height="80px" width="auto" />
        </Flex>

        {/* Empty Flex - to balance out the left navigation */}
        <Flex alignItems="center" width={["auto", "auto", "20%"]}>
          {/* Empty space */}
        </Flex>

      </Flex>
    </Box>
  );
}

export default Header;
