const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Prisma Case Model', () => {
  let testCase;

  beforeAll(async () => {
    // Clean up any existing test cases
    await prisma.case.deleteMany({ where: { name: { startsWith: 'Test Case' } } });
  });

  afterAll(async () => {
    // Clean up the created test case
    if (testCase) {
      await prisma.case.delete({ where: { id: testCase.id } });
    }
    await prisma.$disconnect();
  });

  test('should create a new case', async () => {
    const caseData = {
      name: 'Test Case for Creation',
      description: 'This is a test case.',
    };
    testCase = await prisma.case.create({ data: caseData });
    expect(testCase).toBeDefined();
    expect(testCase.name).toBe(caseData.name);
    expect(testCase.description).toBe(caseData.description);
  });

  test('should retrieve a case', async () => {
    const caseData = {
      name: 'Test Case for Retrieval',
      description: 'This is another test case.',
    };
    const createdCase = await prisma.case.create({ data: caseData });
    const retrievedCase = await prisma.case.findUnique({ where: { id: createdCase.id } });
    expect(retrievedCase).toBeDefined();
    expect(retrievedCase.id).toBe(createdCase.id);
    await prisma.case.delete({ where: { id: createdCase.id } });
  });

  test('should update a case', async () => {
    const caseData = {
      name: 'Test Case for Update',
      description: 'Initial description.',
    };
    const createdCase = await prisma.case.create({ data: caseData });
    const updatedDescription = 'Updated description.';
    const updatedCase = await prisma.case.update({
      where: { id: createdCase.id },
      data: { description: updatedDescription },
    });
    expect(updatedCase.description).toBe(updatedDescription);
    await prisma.case.delete({ where: { id: createdCase.id } });
  });

  test('should delete a case', async () => {
    const caseData = {
      name: 'Test Case for Deletion',
      description: 'This case will be deleted.',
    };
    const createdCase = await prisma.case.create({ data: caseData });
    await prisma.case.delete({ where: { id: createdCase.id } });
    const deletedCase = await prisma.case.findUnique({ where: { id: createdCase.id } });
    expect(deletedCase).toBeNull();
  });

  test('should connect an investigation to a case', async () => {
    // 1. Create a Case
    const caseData = { name: 'Test Case with Investigation' };
    const newCase = await prisma.case.create({ data: caseData });

    // 2. Create an Investigation
    const investigationData = {
      status: 'COMPLETED',
      progress: 100,
    };
    const newInvestigation = await prisma.investigation.create({ data: investigationData });

    // 3. Connect them
    const updatedCase = await prisma.case.update({
      where: { id: newCase.id },
      data: {
        investigations: {
          connect: { id: newInvestigation.id },
        },
      },
      include: {
        investigations: true,
      },
    });

    expect(updatedCase.investigations).toHaveLength(1);
    expect(updatedCase.investigations[0].id).toBe(newInvestigation.id);

    // Cleanup
    await prisma.case.delete({ where: { id: newCase.id } });
    await prisma.investigation.delete({ where: { id: newInvestigation.id } });
  });
});