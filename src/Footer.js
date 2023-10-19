import React from 'react';
import { Box, Flex, Text, useColorMode } from '@chakra-ui/react';

const Footer = () => {
  const { colorMode } = useColorMode();

  return (
    <Box as="footer" bg={colorMode === 'light' ? "#8C52FF" : "gray.800"} p={4} color="white" position="static">
      <Flex alignItems="center" justifyContent="space-between" wrap="wrap" mx="5%">

        {/* Left Container for Navigation and Empty Space */}
        <Flex alignItems="center" width={["auto", "auto", "20%"]}>
          {/* Navigation Links */}
          <Text ml={3} cursor="pointer">Terms</Text>
          <Text ml={3} cursor="pointer">Privacy</Text>
          {/* <Text ml={3} cursor="pointer">Contact</Text> */}
        </Flex>

        {/* Logo or Text - to ensure it is centered */}
        <Flex justifyContent="center" alignItems="center" flex="1">
          <Text>© 2023 VistaScribe</Text>
        </Flex>

        {/* Empty Flex - to balance out the left navigation */}
        <Flex alignItems="center" width={["auto", "auto", "20%"]}>
          {/* Empty space */}
        </Flex>

      </Flex>
    </Box>
  );
}

export default Footer;
