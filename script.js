function findElemByText({str, selector = '*', leaf = 'outerHTML'}){
  // generate regex from string
  const regex = new RegExp(str, 'gmi');
  // search the element for specific word
  const matchOuterHTML = e => (regex.test(e[leaf]))
  // array of elements
  const elementArray = [...document.querySelectorAll(selector)];
  // return filtered element list
  return elementArray.filter(matchOuterHTML)
}
